"""Acceso a Postgres: conexión, migraciones y escrituras idempotentes."""

from datetime import datetime
from pathlib import Path

import psycopg

from pipeline.config import Catalog

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
                "ON CONFLICT (tool_slug, kind) DO UPDATE SET url = EXCLUDED.url "
                "RETURNING id",
                (tool.slug, f"https://api.github.com/repos/{tool.repo}/releases"),
            )
            ids[tool.slug] = cur.fetchone()[0]
    return ids
