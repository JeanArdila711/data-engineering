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
