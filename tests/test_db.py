from datetime import date, datetime, timezone
from pathlib import Path

from pipeline.changes import ExtractedChange
from pipeline.config import Catalog, Tool
from pipeline.db import apply_migrations, quarantine, save_raw_fetch, sync_catalog, sync_sources, upsert_releases
from pipeline.sources.github import ReleaseRecord

T0 = datetime(2026, 1, 1, tzinfo=timezone.utc)
T1 = datetime(2026, 2, 1, tzinfo=timezone.utc)
DS = date(2026, 8, 4)


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


def _record(version: str = "1.0.0", has_breaking: bool = False) -> ReleaseRecord:
    return ReleaseRecord(
        tool_slug="duckdb",
        version=version,
        published_at=T0,
        source_url="https://example.com/r",
        body="cuerpo",
        has_breaking=has_breaking,
        changes=[ExtractedChange(kind="breaking", text="rompió algo")] if has_breaking else [],
    )


def test_save_raw_fetch_stores_new_payload(db_conn):
    source_id = sync_sources(db_conn, _catalog())["duckdb"]
    save_raw_fetch(db_conn, source_id, DS, "contenido")

    with db_conn.cursor() as cur:
        cur.execute("SELECT payload, first_seen_ds, last_seen_ds FROM raw_fetches WHERE source_id = %s", (source_id,))
        payload, first_seen, last_seen = cur.fetchone()

    assert payload == "contenido"
    assert first_seen == DS
    assert last_seen == DS


def test_save_raw_fetch_does_not_duplicate_identical_payload(db_conn):
    source_id = sync_sources(db_conn, _catalog())["duckdb"]
    later = date(2026, 8, 5)

    save_raw_fetch(db_conn, source_id, DS, "sin cambios")
    save_raw_fetch(db_conn, source_id, later, "sin cambios")

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM raw_fetches WHERE source_id = %s", (source_id,))
        assert cur.fetchone()[0] == 1

        cur.execute("SELECT first_seen_ds, last_seen_ds FROM raw_fetches WHERE source_id = %s", (source_id,))
        first_seen, last_seen = cur.fetchone()

    assert first_seen == DS
    assert last_seen == later


def test_save_raw_fetch_stores_content_hash(db_conn):
    source_id = sync_sources(db_conn, _catalog())["duckdb"]
    save_raw_fetch(db_conn, source_id, DS, "contenido")

    with db_conn.cursor() as cur:
        cur.execute("SELECT content_hash FROM raw_fetches WHERE source_id = %s", (source_id,))
        assert len(cur.fetchone()[0]) == 64


def test_upsert_releases_inserts_new(db_conn):
    assert upsert_releases(db_conn, [_record()]) == 1

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM fct_release")
        assert cur.fetchone()[0] == 1


def test_upsert_releases_is_idempotent(db_conn):
    upsert_releases(db_conn, [_record()])
    assert upsert_releases(db_conn, [_record()]) == 0

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM fct_release")
        assert cur.fetchone()[0] == 1


def test_upsert_releases_stores_changes_without_duplicating(db_conn):
    upsert_releases(db_conn, [_record(has_breaking=True)])
    upsert_releases(db_conn, [_record(has_breaking=True)])

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM release_changes")
        assert cur.fetchone()[0] == 1


def test_quarantine_records_error_with_payload(db_conn):
    quarantine(db_conn, "duckdb:github_releases", "parse", "esquema inesperado", "{}")

    with db_conn.cursor() as cur:
        cur.execute("SELECT source_ref, stage, error, payload FROM quarantine")
        row = cur.fetchone()

    assert row == ("duckdb:github_releases", "parse", "esquema inesperado", "{}")
