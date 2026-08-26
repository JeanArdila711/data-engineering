from datetime import date, datetime, timezone

from pipeline.config import Catalog, Tool
from pipeline.llm import SummaryDraft
from pipeline.run_articles import RunArticlesSummary, run
from pipeline.sources.rss import ArticleRecord

DS = date(2026, 8, 22)
NOW = datetime(2026, 8, 22, tzinfo=timezone.utc)


def _catalog() -> Catalog:
    return Catalog(tools=[Tool(
        slug="duckdb", name="DuckDB", category="query-engine",
        feeds=[{"kind": "rss", "url": "https://duckdb.org/feed.xml"}],
    )])


def _fake_fetcher(records):
    def fetcher(url, **kwargs):
        return "<rss/>", records
    return fetcher


class _FakeLLM:
    def draft_summary(self, document, tool_names):
        return SummaryDraft(text="resumen", quotes=[document[:10]])

    def translate(self, text):
        return f"[ES] {text}"

    def judge_entailment(self, quote, summary_text):
        return True


class _FakeLLMRejects:
    def draft_summary(self, document, tool_names):
        return SummaryDraft(text="resumen", quotes=["esto no está en el documento"])

    def translate(self, text):
        return f"[ES] {text}"

    def judge_entailment(self, quote, summary_text):
        return True


class _FakeLLMCrashes:
    """Reproduce el bug real de producción: Gemini devuelve algo que no es
    JSON parseable y GeminiClient.draft_summary explota con JSONDecodeError."""

    def draft_summary(self, document, tool_names):
        import json

        json.loads("")  # dispara json.decoder.JSONDecodeError, igual que en prod

    def translate(self, text):
        return f"[ES] {text}"

    def judge_entailment(self, quote, summary_text):
        return True


def _record(url="https://duckdb.org/a", text="DuckDB 1.5 salió hoy con mejoras") -> ArticleRecord:
    return ArticleRecord(url=url, title="T", author=None, published_at=NOW, summary_text=text)


def test_run_processes_feeds_and_inserts_articles(db_conn):
    summary = run(db_conn, _catalog(), _FakeLLM(), DS, NOW, fetcher=_fake_fetcher([_record()]))

    assert isinstance(summary, RunArticlesSummary)
    assert summary.feeds_processed == 1
    assert summary.articles_inserted == 1


def test_run_skips_articles_without_catalog_mentions(db_conn):
    unrelated = _record(text="un artículo que no menciona nada del catálogo")
    summary = run(db_conn, _catalog(), _FakeLLM(), DS, NOW, fetcher=_fake_fetcher([unrelated]))

    assert summary.articles_inserted == 0


def test_run_is_idempotent(db_conn):
    fetcher = _fake_fetcher([_record()])
    run(db_conn, _catalog(), _FakeLLM(), DS, NOW, fetcher=fetcher)
    second = run(db_conn, _catalog(), _FakeLLM(), DS, NOW, fetcher=fetcher)

    assert second.articles_inserted == 0
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM articles")
        assert cur.fetchone()[0] == 1


def test_run_summarizes_top_scored_articles(db_conn):
    summary = run(db_conn, _catalog(), _FakeLLM(), DS, NOW, fetcher=_fake_fetcher([_record()]))

    assert summary.summaries_accepted == 1
    with db_conn.cursor() as cur:
        cur.execute("SELECT idioma FROM summaries ORDER BY idioma")
        assert [row[0] for row in cur.fetchall()] == ["en", "es"]


def test_run_quarantines_rejected_summary_without_crashing(db_conn):
    summary = run(db_conn, _catalog(), _FakeLLMRejects(), DS, NOW, fetcher=_fake_fetcher([_record()]))

    assert summary.summaries_rejected == 1
    assert summary.summaries_accepted == 0
    with db_conn.cursor() as cur:
        cur.execute("SELECT source_ref, stage FROM quarantine")
        assert cur.fetchone() == ("article:1", "anchor")


def test_run_survives_llm_exception_during_summarize(db_conn):
    summary = run(db_conn, _catalog(), _FakeLLMCrashes(), DS, NOW, fetcher=_fake_fetcher([_record()]))

    assert summary.articles_inserted == 1
    assert summary.summaries_accepted == 0
    assert summary.failures == 1
    with db_conn.cursor() as cur:
        cur.execute("SELECT source_ref, stage FROM quarantine")
        assert cur.fetchone() == ("article:1", "summarize")


def test_run_records_source_failure_on_feed_error(db_conn):
    from pipeline.run_articles import run

    catalog = Catalog(tools=[Tool(
        slug="duckdb", name="DuckDB", category="test",
        feeds=[{"kind": "rss", "url": "https://x"}],
    )])

    def failing_fetcher(url, **kwargs):
        raise ValueError("feed roto")

    run(db_conn, catalog, llm_client=None, ds=DS, now=NOW, fetcher=failing_fetcher)

    with db_conn.cursor() as cur:
        cur.execute("SELECT consecutive_failures FROM sources WHERE tool_slug = 'duckdb' AND kind = 'rss'")
        assert cur.fetchone()[0] == 1


def test_run_mines_candidates_from_unmatched_articles(db_conn):
    from pipeline.run_articles import run

    catalog = Catalog(tools=[Tool(
        slug="duckdb", name="DuckDB", category="test",
        feeds=[{"kind": "rss", "url": "https://x"}],
    )])

    record = ArticleRecord(
        url="https://a.example/1",
        title="Sin menciones conocidas",
        author=None,
        published_at=NOW,
        summary_text="Este artículo habla de Fooflow, una herramienta nueva.",
    )

    class _FakeDiscoveryLLM:
        def extract_candidates(self, document, known_names):
            return ["Fooflow"]

    run(db_conn, catalog, llm_client=_FakeDiscoveryLLM(), ds=DS, now=NOW,
        fetcher=lambda url, **kwargs: ("{}", [record]))

    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT tc.display_name, count(tcm.id) FROM tool_candidates tc "
            "JOIN tool_candidate_mentions tcm ON tcm.candidate_id = tc.id "
            "WHERE tc.normalized_name = 'fooflow' GROUP BY tc.display_name"
        )
        display_name, mention_count = cur.fetchone()
    assert display_name == "Fooflow"
    assert mention_count == 1


def test_run_normalizes_url_before_recording_candidate_mention(db_conn):
    from pipeline.run_articles import run

    catalog = Catalog(tools=[Tool(
        slug="duckdb", name="DuckDB", category="test",
        feeds=[{"kind": "rss", "url": "https://x"}],
    )])

    record_a = ArticleRecord(
        url="https://a.example/post?utm_source=feed",
        title="Sin menciones conocidas",
        author=None,
        published_at=NOW,
        summary_text="Este artículo habla de Fooflow, una herramienta nueva.",
    )
    record_b = ArticleRecord(
        url="https://a.example/post",
        title="Sin menciones conocidas",
        author=None,
        published_at=NOW,
        summary_text="Este artículo habla de Fooflow, una herramienta nueva.",
    )

    class _FakeDiscoveryLLM:
        def extract_candidates(self, document, known_names):
            return ["Fooflow"]

    run(db_conn, catalog, llm_client=_FakeDiscoveryLLM(), ds=DS, now=NOW,
        fetcher=lambda url, **kwargs: ("{}", [record_a, record_b]))

    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT count(*) FROM tool_candidate_mentions tcm "
            "JOIN tool_candidates tc ON tc.id = tcm.candidate_id "
            "WHERE tc.normalized_name = 'fooflow'"
        )
        assert cur.fetchone()[0] == 1  # misma URL normalizada (con y sin utm_source), una sola mención


def test_run_skips_candidate_mining_for_old_articles(db_conn):
    from datetime import timedelta
    from pipeline.run_articles import run

    catalog = Catalog(tools=[Tool(
        slug="duckdb", name="DuckDB", category="test",
        feeds=[{"kind": "rss", "url": "https://x"}],
    )])

    old_record = ArticleRecord(
        url="https://a.example/old",
        title="Sin menciones conocidas",
        author=None,
        published_at=NOW - timedelta(days=10),
        summary_text="Este artículo habla de Fooflow, una herramienta nueva.",
    )

    class _FakeDiscoveryLLM:
        def extract_candidates(self, document, known_names):
            return ["Fooflow"]

    run(db_conn, catalog, llm_client=_FakeDiscoveryLLM(), ds=DS, now=NOW,
        fetcher=lambda url, **kwargs: ("{}", [old_record]))

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM tool_candidates WHERE normalized_name = 'fooflow'")
        assert cur.fetchone()[0] == 0
