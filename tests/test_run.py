from datetime import date, datetime, timezone

from pipeline.config import Catalog, Tool
from pipeline.fetch import PermanentError
from pipeline.run import RunSummary, run

DS = date(2026, 8, 4)
NOW = datetime(2026, 8, 4, tzinfo=timezone.utc)


def _catalog_of(*slugs: str) -> Catalog:
    return Catalog(
        tools=[
            Tool(slug=s, name=s.title(), category="test", repo=f"org/{s}")
            for s in slugs
        ]
    )


def _fake_fetcher(records_by_slug: dict, failing: set[str] | None = None):
    failing = failing or set()

    def fetcher(tool, token, **kwargs):
        if tool.slug in failing:
            raise PermanentError(f"{tool.slug} devolvió 404")
        return "{}", records_by_slug.get(tool.slug, [])

    return fetcher


def test_run_processes_every_tool(db_conn):
    from tests.test_db import _record

    summary = run(
        db_conn,
        _catalog_of("duckdb", "polars"),
        token="x",
        ds=DS,
        now=NOW,
        fetcher=_fake_fetcher({"duckdb": [_record()]}),
    )

    assert isinstance(summary, RunSummary)
    assert summary.tools_processed == 2
    assert summary.releases_inserted == 1
    assert summary.failures == 0


def test_run_is_idempotent(db_conn):
    from tests.test_db import _record

    fetcher = _fake_fetcher({"duckdb": [_record()]})
    run(db_conn, _catalog_of("duckdb"), token="x", ds=DS, now=NOW, fetcher=fetcher)
    second = run(db_conn, _catalog_of("duckdb"), token="x", ds=DS, now=NOW, fetcher=fetcher)

    assert second.releases_inserted == 0

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM fct_release")
        assert cur.fetchone()[0] == 1


def test_run_isolates_failing_source(db_conn):
    from tests.test_db import _record

    summary = run(
        db_conn,
        _catalog_of("duckdb", "polars"),
        token="x",
        ds=DS,
        now=NOW,
        fetcher=_fake_fetcher({"duckdb": [_record()]}, failing={"polars"}),
    )

    assert summary.failures == 1
    assert summary.releases_inserted == 1

    with db_conn.cursor() as cur:
        cur.execute("SELECT source_ref, stage FROM quarantine")
        assert cur.fetchone() == ("polars:github_releases", "fetch")


def test_run_increments_consecutive_failures(db_conn):
    fetcher = _fake_fetcher({}, failing={"polars"})
    run(db_conn, _catalog_of("polars"), token="x", ds=DS, now=NOW, fetcher=fetcher)
    run(db_conn, _catalog_of("polars"), token="x", ds=DS, now=NOW, fetcher=fetcher)

    with db_conn.cursor() as cur:
        cur.execute("SELECT consecutive_failures, is_degraded FROM sources WHERE tool_slug = 'polars'")
        failures, degraded = cur.fetchone()

    assert failures == 2
    assert degraded is False


def test_run_marks_source_degraded_after_three_failures(db_conn):
    fetcher = _fake_fetcher({}, failing={"polars"})
    for _ in range(3):
        run(db_conn, _catalog_of("polars"), token="x", ds=DS, now=NOW, fetcher=fetcher)

    with db_conn.cursor() as cur:
        cur.execute("SELECT is_degraded FROM sources WHERE tool_slug = 'polars'")
        assert cur.fetchone()[0] is True


def test_run_resets_failure_counter_on_success(db_conn):
    run(db_conn, _catalog_of("polars"), token="x", ds=DS, now=NOW, fetcher=_fake_fetcher({}, failing={"polars"}))
    run(db_conn, _catalog_of("polars"), token="x", ds=DS, now=NOW, fetcher=_fake_fetcher({}))

    with db_conn.cursor() as cur:
        cur.execute("SELECT consecutive_failures, last_success_at FROM sources WHERE tool_slug = 'polars'")
        failures, last_success = cur.fetchone()

    assert failures == 0
    assert last_success is not None


def test_run_saves_raw_payload(db_conn):
    run(db_conn, _catalog_of("duckdb"), token="x", ds=DS, now=NOW, fetcher=_fake_fetcher({}))

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM raw_fetches")
        assert cur.fetchone()[0] == 1


def test_run_does_not_grow_raw_fetches_when_payload_is_unchanged(db_conn):
    from datetime import timedelta

    fetcher = _fake_fetcher({})
    run(db_conn, _catalog_of("duckdb"), token="x", ds=DS, now=NOW, fetcher=fetcher)
    run(db_conn, _catalog_of("duckdb"), token="x", ds=DS + timedelta(days=1), now=NOW, fetcher=fetcher)

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM raw_fetches")
        assert cur.fetchone()[0] == 1
