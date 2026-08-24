from dataclasses import dataclass

from pipeline.llm import SummaryDraft
from pipeline.summarize import summarize_article

DOCUMENT = "DuckDB 1.5 rompe la API de extensiones. El cambio es intencional y está documentado."


@dataclass
class _Article:
    id: int = 1
    summary_text: str = DOCUMENT


class _FakeLLM:
    def __init__(self, draft: SummaryDraft):
        self._draft = draft

    def draft_summary(self, document: str, tool_names: list[str]) -> SummaryDraft:
        return self._draft


def _quarantine_log():
    calls = []

    def fn(source_ref, stage, error, payload=None):
        calls.append((source_ref, stage, error))

    fn.calls = calls
    return fn


class _FakeCursor:
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def execute(self, *args, **kwargs):
        pass

    def fetchone(self):
        return (1,)


class _FakeConn:
    def cursor(self):
        return _FakeCursor()


def test_accepts_summary_when_all_quotes_anchor():
    llm = _FakeLLM(SummaryDraft(text="DuckDB rompió la API.", quotes=["rompe la API de extensiones"]))
    q = _quarantine_log()

    result = summarize_article(_Article(), ["DuckDB"], llm, q, conn=_FakeConn())

    assert result is not None
    assert q.calls == []


def test_rejects_summary_when_any_quote_does_not_anchor():
    llm = _FakeLLM(SummaryDraft(text="texto inventado", quotes=["esto no está en el documento"]))
    q = _quarantine_log()

    result = summarize_article(_Article(), ["DuckDB"], llm, q)

    assert result is None
    assert q.calls[0][1] == "anchor"


def test_returns_claims_with_computed_offsets(db_conn):
    from pipeline.db import find_duplicate_article  # noqa: F401 — asegura fixture db_conn disponible
    from pipeline.dedup import content_fingerprint, normalize_url
    from pipeline.db import sync_feed_sources, upsert_article
    from pipeline.sources.rss import ArticleRecord
    from pipeline.config import Catalog, Tool
    from datetime import datetime, timezone

    catalog = Catalog(tools=[Tool(
        slug="duckdb", name="DuckDB", category="x",
        feeds=[{"kind": "rss", "url": "https://duckdb.org/feed.xml"}],
    )])
    source_id = sync_feed_sources(db_conn, catalog)[0][1]
    record = ArticleRecord(
        url="https://duckdb.org/a", title="T", author=None,
        published_at=datetime(2026, 1, 1, tzinfo=timezone.utc), summary_text=DOCUMENT,
    )
    article_id = upsert_article(
        db_conn, source_id, record, normalize_url(record.url), content_fingerprint(DOCUMENT), 0.5
    )

    llm = _FakeLLM(SummaryDraft(text="resumen", quotes=["rompe la API de extensiones"]))
    summary_id = summarize_article(
        _Article(id=article_id, summary_text=DOCUMENT), ["DuckDB"], llm, _quarantine_log(), conn=db_conn
    )

    with db_conn.cursor() as cur:
        cur.execute("SELECT quoted_text, span_start, span_end FROM claims WHERE summary_id = %s", (summary_id,))
        quoted, start, end = cur.fetchone()

    assert quoted == "rompe la API de extensiones"
    assert DOCUMENT.lower()[start:end] == quoted.lower()
