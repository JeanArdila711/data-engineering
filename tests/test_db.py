from datetime import date, datetime, timezone
from pathlib import Path

from pipeline.changes import ExtractedChange
from pipeline.config import Catalog, Tool
from pipeline.db import apply_migrations, quarantine, save_raw_fetch, sync_catalog, sync_sources, upsert_releases
from pipeline.dedup import content_fingerprint, normalize_url
from pipeline.db import (
    find_duplicate_article,
    sync_feed_sources,
    upsert_article,
    upsert_mentions,
)
from pipeline.sources.github import ReleaseRecord
from pipeline.sources.rss import ArticleRecord

T0 = datetime(2026, 1, 1, tzinfo=timezone.utc)
T1 = datetime(2026, 2, 1, tzinfo=timezone.utc)
DS = date(2026, 8, 4)
T_ARTICLE = datetime(2026, 8, 1, tzinfo=timezone.utc)


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

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM schema_migrations")
        before = cur.fetchone()[0]

    apply_migrations(db_conn, Path("migrations"))

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM schema_migrations")
        assert cur.fetchone()[0] == before


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


def test_migrations_create_article_tables(db_conn):
    assert {
        "articles",
        "fct_article_mention",
        "summaries",
        "claims",
        "entailment_checks",
    } <= _tables(db_conn)


def test_sources_allows_multiple_urls_per_tool_and_kind(db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            "INSERT INTO sources (tool_slug, kind, url) VALUES ('duckdb', 'rss', 'https://a.com/feed')"
        )
        cur.execute(
            "INSERT INTO sources (tool_slug, kind, url) VALUES ('duckdb', 'rss', 'https://b.com/feed')"
        )
        cur.execute("SELECT count(*) FROM sources WHERE tool_slug = 'duckdb'")
        assert cur.fetchone()[0] == 2


def test_quarantine_records_error_with_payload(db_conn):
    quarantine(db_conn, "duckdb:github_releases", "parse", "esquema inesperado", "{}")

    with db_conn.cursor() as cur:
        cur.execute("SELECT source_ref, stage, error, payload FROM quarantine")
        row = cur.fetchone()

    assert row == ("duckdb:github_releases", "parse", "esquema inesperado", "{}")


def _catalog_with_feed() -> Catalog:
    return Catalog(
        tools=[
            Tool(
                slug="duckdb", name="DuckDB", category="query-engine",
                feeds=[{"kind": "rss", "url": "https://duckdb.org/feed.xml"}],
            )
        ]
    )


def _article_record(url: str = "https://duckdb.org/a", text: str = "contenido") -> ArticleRecord:
    return ArticleRecord(url=url, title="T", author=None, published_at=T_ARTICLE, summary_text=text)


def test_sync_feed_sources_registers_one_row_per_feed(db_conn):
    refs = sync_feed_sources(db_conn, _catalog_with_feed())
    assert refs == [("duckdb", refs[0][1], "https://duckdb.org/feed.xml")]


def test_sync_feed_sources_is_idempotent(db_conn):
    first = sync_feed_sources(db_conn, _catalog_with_feed())
    second = sync_feed_sources(db_conn, _catalog_with_feed())
    assert first == second


def _feed_source_id(conn) -> int:
    return sync_feed_sources(conn, _catalog_with_feed())[0][1]


def test_upsert_article_inserts_new(db_conn):
    source_id = _feed_source_id(db_conn)
    record = _article_record()

    article_id = upsert_article(
        db_conn, source_id, record, normalize_url(record.url), content_fingerprint(record.summary_text), 0.5
    )

    assert article_id is not None
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM articles")
        assert cur.fetchone()[0] == 1


def test_upsert_article_skips_duplicate_url(db_conn):
    source_id = _feed_source_id(db_conn)
    record = _article_record()
    url_norm = normalize_url(record.url)
    fp = content_fingerprint(record.summary_text)

    first = upsert_article(db_conn, source_id, record, url_norm, fp, 0.5)
    second = upsert_article(db_conn, source_id, record, url_norm, fp, 0.5)

    assert first is not None
    assert second is None


def test_upsert_mentions_links_tools_to_article(db_conn):
    source_id = _feed_source_id(db_conn)
    article_id = upsert_article(
        db_conn, source_id, _article_record(), normalize_url("https://duckdb.org/a"), "hash", 0.5
    )

    upsert_mentions(db_conn, article_id, {"duckdb", "polars"})

    with db_conn.cursor() as cur:
        cur.execute("SELECT tool_slug FROM fct_article_mention WHERE article_id = %s ORDER BY tool_slug", (article_id,))
        assert [row[0] for row in cur.fetchall()] == ["duckdb", "polars"]


def test_find_duplicate_article_matches_by_content_hash(db_conn):
    source_id = _feed_source_id(db_conn)
    fp = content_fingerprint("mismo contenido, otra url")
    upsert_article(db_conn, source_id, _article_record("https://a.com/1"), "https://a.com/1", fp, 0.5)

    duplicate = find_duplicate_article(db_conn, "https://b.com/2", fp)

    assert duplicate is not None


def test_find_duplicate_article_returns_none_for_distinct_content(db_conn):
    source_id = _feed_source_id(db_conn)
    upsert_article(
        db_conn, source_id, _article_record("https://a.com/1"), "https://a.com/1",
        content_fingerprint("texto A"), 0.5,
    )

    duplicate = find_duplicate_article(db_conn, "https://b.com/2", content_fingerprint("texto B, sin relación"))

    assert duplicate is None
