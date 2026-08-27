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
    con el catálogo sin cambios no altera la tabla. Una herramienta que sale
    del catálogo cierra su fila vigente (is_current=FALSE) sin insertar
    reemplazo — el catálogo sigue siendo la única fuente de qué existe.
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

        cur.execute(
            "UPDATE dim_tool SET effective_to = %s, is_current = FALSE "
            "WHERE is_current AND NOT (slug = ANY(%s))",
            (now, [tool.slug for tool in catalog.tools]),
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
                "(tool_slug, version, raw_version, published_at, source_url, has_breaking, body) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) "
                "ON CONFLICT (tool_slug, version) DO NOTHING "
                "RETURNING id",
                (
                    record.tool_slug,
                    record.version,
                    record.raw_version,
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
    content_hash: str,
    summary_text: str,
    similarity_threshold: float = 0.85,
) -> int | None:
    """Busca una republicación literal: mismo hash exacto, o texto casi-idéntico por trigramas.

    El fallback compara `summary_text` (no la URL): el caso real de republicación
    es el mismo artículo con URLs de dominios distintos, así que el contenido es
    la señal que importa. `articles_content_trgm_idx` (migración 002) indexa esa
    columna para esta consulta.
    """
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM articles WHERE content_hash = %s LIMIT 1", (content_hash,))
        row = cur.fetchone()
        if row:
            return row[0]

        cur.execute(
            "SELECT id FROM articles WHERE similarity(summary_text, %s) > %s "
            "ORDER BY similarity(summary_text, %s) DESC LIMIT 1",
            (summary_text, similarity_threshold, summary_text),
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


DEGRADED_AFTER_FAILURES = 3


def record_source_failure(conn: psycopg.Connection, source_id: int) -> None:
    """Incrementa consecutive_failures y marca is_degraded al cruzar el umbral."""
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE sources SET consecutive_failures = consecutive_failures + 1, "
            "is_degraded = (consecutive_failures + 1) >= %s WHERE id = %s",
            (DEGRADED_AFTER_FAILURES, source_id),
        )


def record_source_success(conn: psycopg.Connection, source_id: int, now: datetime) -> None:
    """Resetea el contador de fallos y limpia degradación/alerta al recuperarse."""
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE sources SET consecutive_failures = 0, is_degraded = FALSE, "
            "last_success_at = %s, alerted_at = NULL WHERE id = %s",
            (now, source_id),
        )


CANDIDATE_THRESHOLD = 2


def upsert_candidate(conn: psycopg.Connection, name: str, article_url: str, now: datetime) -> None:
    """Registra la mención de un candidato. Idempotente: el mismo (candidato, artículo)
    nunca cuenta dos veces, sin importar cuántas veces se reprocese el artículo.
    Congelado si el candidato ya fue propuesto o descartado.
    """
    normalized = name.strip().casefold()
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO tool_candidates (normalized_name, display_name, first_seen_at, last_seen_at) "
            "VALUES (%s, %s, %s, %s) "
            "ON CONFLICT (normalized_name) DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at "
            "WHERE tool_candidates.status = 'pending' "
            "RETURNING id",
            (normalized, name.strip(), now, now),
        )
        row = cur.fetchone()
        if row is None:
            # Ya existe y no está en 'pending' (proposed/dismissed): no se registra la mención.
            return
        candidate_id = row[0]

        cur.execute(
            "INSERT INTO tool_candidate_mentions (candidate_id, article_url) VALUES (%s, %s) "
            "ON CONFLICT (candidate_id, article_url) DO NOTHING",
            (candidate_id, article_url),
        )


def pending_candidates_over_threshold(
    conn: psycopg.Connection, threshold: int = CANDIDATE_THRESHOLD
) -> list[tuple[int, str, int, str]]:
    """Devuelve (id, display_name, mention_count, example_article_url) listos para alertar.
    mention_count y example_article_url se calculan por join, nunca se guardan como
    columna propia — evita que un contador desincronizado mienta sobre el conteo real.
    """
    with conn.cursor() as cur:
        cur.execute(
            "SELECT tc.id, tc.display_name, count(tcm.id), "
            "(array_agg(tcm.article_url ORDER BY tcm.id DESC))[1] "
            "FROM tool_candidates tc "
            "JOIN tool_candidate_mentions tcm ON tcm.candidate_id = tc.id "
            "WHERE tc.status = 'pending' "
            "GROUP BY tc.id, tc.display_name "
            "HAVING count(tcm.id) >= %s",
            (threshold,),
        )
        return cur.fetchall()


def mark_candidate_proposed(conn: psycopg.Connection, candidate_id: int) -> None:
    with conn.cursor() as cur:
        cur.execute("UPDATE tool_candidates SET status = 'proposed' WHERE id = %s", (candidate_id,))


def degraded_sources_needing_alert(conn: psycopg.Connection) -> list[tuple[int, str, str]]:
    """Devuelve (id, tool_slug, kind) de fuentes degradadas sin alertar todavía."""
    with conn.cursor() as cur:
        cur.execute("SELECT id, tool_slug, kind FROM sources WHERE is_degraded AND alerted_at IS NULL")
        return cur.fetchall()


def mark_source_alerted(conn: psycopg.Connection, source_id: int, now: datetime) -> None:
    with conn.cursor() as cur:
        cur.execute("UPDATE sources SET alerted_at = %s WHERE id = %s", (now, source_id))
