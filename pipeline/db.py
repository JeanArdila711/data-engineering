"""Acceso a Postgres: conexión, migraciones y escrituras idempotentes."""

from pathlib import Path

import psycopg

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
