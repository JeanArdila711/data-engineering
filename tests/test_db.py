from pathlib import Path

from pipeline.db import apply_migrations


def _tables(conn) -> set[str]:
    with conn.cursor() as cur:
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        return {row[0] for row in cur.fetchall()}


def test_migrations_create_expected_tables(db_conn):
    assert {
        "dim_tool",
        "sources",
        "raw_fetches",
        "fct_release",
        "release_changes",
        "quarantine",
        "schema_migrations",
    } <= _tables(db_conn)


def test_migrations_are_idempotent(db_conn):
    apply_migrations(db_conn, Path("migrations"))
    apply_migrations(db_conn, Path("migrations"))

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM schema_migrations")
        assert cur.fetchone()[0] == 1


def test_release_has_unique_constraint_on_natural_key(db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT count(*) FROM pg_indexes
            WHERE tablename = 'fct_release' AND indexdef LIKE '%UNIQUE%'
              AND indexdef LIKE '%tool_slug%' AND indexdef LIKE '%version%'
            """
        )
        assert cur.fetchone()[0] >= 1


def test_dim_tool_has_scd2_columns(db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'dim_tool'"
        )
        columns = {row[0] for row in cur.fetchall()}

    assert {"tool_key", "slug", "effective_from", "effective_to", "is_current"} <= columns
