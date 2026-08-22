from datetime import datetime, timezone
from pathlib import Path

from pipeline.config import Catalog, Tool
from pipeline.db import apply_migrations, sync_catalog, sync_sources

T0 = datetime(2026, 1, 1, tzinfo=timezone.utc)
T1 = datetime(2026, 2, 1, tzinfo=timezone.utc)


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


def _catalog(category: str = "query-engine") -> Catalog:
    return Catalog(tools=[Tool(slug="duckdb", name="DuckDB", category=category, repo="duckdb/duckdb")])


def _rows(conn):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT slug, category, effective_from, effective_to, is_current "
            "FROM dim_tool ORDER BY effective_from"
        )
        return cur.fetchall()


def test_sync_catalog_inserts_new_tool(db_conn):
    sync_catalog(db_conn, _catalog(), T0)

    rows = _rows(db_conn)
    assert len(rows) == 1
    assert rows[0][0] == "duckdb"
    assert rows[0][3] is None
    assert rows[0][4] is True


def test_sync_catalog_is_idempotent_when_nothing_changes(db_conn):
    sync_catalog(db_conn, _catalog(), T0)
    sync_catalog(db_conn, _catalog(), T1)

    assert len(_rows(db_conn)) == 1


def test_sync_catalog_closes_old_row_when_attribute_changes(db_conn):
    sync_catalog(db_conn, _catalog("query-engine"), T0)
    sync_catalog(db_conn, _catalog("olap-database"), T1)

    rows = _rows(db_conn)
    assert len(rows) == 2

    old, new = rows
    assert old[1] == "query-engine"
    assert old[3] == T1
    assert old[4] is False
    assert new[1] == "olap-database"
    assert new[4] is True


def test_sync_sources_returns_ids_and_is_idempotent(db_conn):
    first = sync_sources(db_conn, _catalog())
    second = sync_sources(db_conn, _catalog())

    assert first == second
    assert "duckdb" in first
