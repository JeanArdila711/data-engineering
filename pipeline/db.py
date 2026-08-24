"""Acceso a Postgres: conexión, migraciones y escrituras idempotentes."""

import hashlib
from datetime import date, datetime
from pathlib import Path

import psycopg

from pipeline.config import Catalog
from pipeline.sources.github import ReleaseRecord

_MIGRATIONS_TABLE = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""


def connect(dsn: str) -> psycopg.Connection:
    return psycopg.connect(dsn, autocommit=True)


def apply_migrations(conn: psycopg.Connection, directory: Path = Path("migrations")) -> None:
    """Aplica las migraciones pendientes. Correrlo dos veces no cambia nada."""
    with conn.cursor() as cur:
        cur.execute(_MIGRATIONS_TABLE)
        cur.execute("SELECT filename FROM schema_migrations")
        applied = {row[0] for row in cur.fetchall()}

    for path in sorted(directory.glob("*.sql")):
        if path.name in applied:
            continue
        with conn.cursor() as cur:
            cur.execute(path.read_text())
            cur.execute("INSERT INTO schema_migrations (filename) VALUES (%s)", (path.name,))


_TRACKED_ATTRIBUTES = ("name", "category", "vendor", "repo", "homepage")


def sync_catalog(conn: psycopg.Connection, catalog: Catalog, now: datetime) -> None:
    """Sincroniza el catálogo a dim_tool como SCD Tipo 2.

    Una fila nueva solo se crea cuando cambia un atributo rastreado; correrlo
    con el catálogo sin cambios no altera la tabla.
    """
    with conn.cursor() as cur:
        for tool in catalog.tools:
            cur.execute(
                "SELECT name, category, vendor, repo, homepage FROM dim_tool "
                "WHERE slug = %s AND is_current",
                (tool.slug,),
            )
            current = cur.fetchone()
            incoming = tuple(getattr(tool, attr) for attr in _TRACKED_ATTRIBUTES)

            if current is not None and tuple(current) == incoming:
                continue

            if current is not None:
                cur.execute(
                    "UPDATE dim_tool SET effective_to = %s, is_current = FALSE "
                    "WHERE slug = %s AND is_current",
                    (now, tool.slug),
                )

            cur.execute(
                "INSERT INTO dim_tool "
                "(slug, name, category, vendor, repo, homepage, effective_from, is_current) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)",
                (tool.slug, *incoming, now),
            )


def sync_sources(conn: psycopg.Connection, catalog: Catalog) -> dict[str, int]:
    """Registra una fuente github_releases por herramienta y devuelve sus ids."""
    ids: dict[str, int] = {}
    with conn.cursor() as cur:
        for tool in catalog.tools:
            if not tool.repo:
                continue
            cur.execute(
                "INSERT INTO sources (tool_slug, kind, url) VALUES (%s, 'github_releases', %s) "
                "ON CONFLICT (tool_slug, kind, url) DO UPDATE SET url = EXCLUDED.url "
                "RETURNING id",
                (tool.slug, f"https://api.github.com/repos/{tool.repo}/releases"),
            )
            ids[tool.slug] = cur.fetchone()[0]
    return ids


def save_raw_fetch(conn: psycopg.Connection, source_id: int, ds: date, payload: str) -> None:
    """Guarda el payload crudo, particionado por contenido en vez de por fecha.

    El free tier de Neon da 0.5 GB de storage; una fila diaria por fuente lo
    llenaría en meses cuando la mayoría de los días el payload no cambia. Si
    ya existe una fila con el mismo hash, solo se actualiza last_seen_ds.
    """
    content_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO raw_fetches (source_id, content_hash, first_seen_ds, last_seen_ds, payload) "
            "VALUES (%s, %s, %s, %s, %s) "
            "ON CONFLICT (source_id, content_hash) DO UPDATE "
            "SET last_seen_ds = GREATEST(raw_fetches.last_seen_ds, EXCLUDED.last_seen_ds)",
            (source_id, content_hash, ds, ds, payload),
        )


def upsert_releases(conn: psycopg.Connection, records: list[ReleaseRecord]) -> int:
    """Inserta releases nuevos por clave natural. Devuelve cuántos eran nuevos."""
    inserted = 0
    with conn.cursor() as cur:
        for record in records:
            cur.execute(
                "INSERT INTO fct_release "
                "(tool_slug, version, published_at, source_url, has_breaking, body) "
                "VALUES (%s, %s, %s, %s, %s, %s) "
                "ON CONFLICT (tool_slug, version) DO NOTHING "
                "RETURNING id",
                (
                    record.tool_slug,
                    record.version,
                    record.published_at,
                    record.source_url,
                    record.has_breaking,
                    record.body,
                ),
            )
            row = cur.fetchone()
            if row is None:
                continue

            inserted += 1
            release_id = row[0]
            for change in record.changes:
                cur.execute(
                    "INSERT INTO release_changes (release_id, kind, text) VALUES (%s, %s, %s) "
                    "ON CONFLICT (release_id, kind, text) DO NOTHING",
                    (release_id, change.kind, change.text),
                )

    return inserted


def sync_feed_sources(conn: psycopg.Connection, catalog: Catalog) -> list[tuple[str, int, str]]:
    """Registra una fuente 'rss' por feed declarado. Un tool puede tener varios feeds."""
    refs: list[tuple[str, int, str]] = []
    with conn.cursor() as cur:
        for tool in catalog.tools:
            for feed in tool.feeds:
                cur.execute(
                    "INSERT INTO sources (tool_slug, kind, url) VALUES (%s, %s, %s) "
                    "ON CONFLICT (tool_slug, kind, url) DO UPDATE SET url = EXCLUDED.url "
                    "RETURNING id",
                    (tool.slug, feed.kind, feed.url),
                )
                refs.append((tool.slug, cur.fetchone()[0], feed.url))
    return refs


def find_duplicate_article(
    conn: psycopg.Connection,
    url_normalized: str,
    content_hash: str,
    similarity_threshold: float = 0.85,
) -> int | None:
    """Busca una republicación literal: mismo hash exacto, o texto casi-idéntico por trigramas."""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM articles WHERE content_hash = %s LIMIT 1", (content_hash,))
        row = cur.fetchone()
        if row:
            return row[0]

        cur.execute(
            "SELECT id FROM articles WHERE similarity(url_normalized, %s) > %s "
            "ORDER BY similarity(url_normalized, %s) DESC LIMIT 1",
            (url_normalized, similarity_threshold, url_normalized),
        )
        row = cur.fetchone()
        return row[0] if row else None


def upsert_article(
    conn: psycopg.Connection,
    feed_source_id: int,
    record,
    url_normalized: str,
    content_hash: str,
    score: float,
) -> int | None:
    """Inserta un artículo nuevo por url_normalized. Devuelve None si ya existía."""
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO articles "
            "(feed_source_id, url, url_normalized, title, author, published_at, summary_text, "
            "content_hash, relevance_score) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "ON CONFLICT (url_normalized) DO NOTHING RETURNING id",
            (
                feed_source_id, record.url, url_normalized, record.title, record.author,
                record.published_at, record.summary_text, content_hash, score,
            ),
        )
        row = cur.fetchone()
        return row[0] if row else None


def upsert_mentions(conn: psycopg.Connection, article_id: int, tool_slugs: set[str]) -> None:
    with conn.cursor() as cur:
        for slug in tool_slugs:
            cur.execute(
                "INSERT INTO fct_article_mention (article_id, tool_slug) VALUES (%s, %s) "
                "ON CONFLICT (article_id, tool_slug) DO NOTHING",
                (article_id, slug),
            )


def quarantine(
    conn: psycopg.Connection,
    source_ref: str,
    stage: str,
    error: str,
    payload: str | None = None,
) -> None:
    """Aísla lo que falló validación, con contexto suficiente para depurarlo."""
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO quarantine (source_ref, stage, error, payload) VALUES (%s, %s, %s, %s)",
            (source_ref, stage, error, payload),
        )
