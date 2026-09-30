from datetime import date, datetime, timedelta, timezone

import yaml

from pipeline.config import Catalog, Tool
from pipeline.glosario import Glosario, GlossarySource, GlossaryTerm
from pipeline.llm import SummaryDraft
from pipeline.roadmap import Roadmap
from pipeline.run_articles import RunArticlesSummary, run
from pipeline.sources.rss import ArticleRecord

DS = date(2026, 8, 22)
NOW = datetime(2026, 8, 22, tzinfo=timezone.utc)
ROADMAP_VACIO = Roadmap(nodes=[])
GLOSARIO_VACIO = Glosario(terminos=[])


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


class _FakeLLMEntailmentQuotaExceeded:
    """Reproduce el bug real de producción: judge_entailment pega contra la
    cuota gratuita de Gemini (429) y no había try/except alrededor del loop."""

    def draft_summary(self, document, tool_names):
        return SummaryDraft(text="resumen", quotes=[document[:10]])

    def translate(self, text):
        return f"[ES] {text}"

    def judge_entailment(self, quote, summary_text):
        raise RuntimeError("429 RESOURCE_EXHAUSTED")


class _FakeLLMTranslateCrashes(_FakeLLM):
    """El resumen en inglés sale bien y la traducción revienta: es el 429 que el
    2026-09-30 dejó 2 artículos con resumen EN y sin ES."""

    def translate(self, text):
        raise RuntimeError("429 RESOURCE_EXHAUSTED")


class _CountingLLM(_FakeLLM):
    def __init__(self):
        self.drafts = 0

    def draft_summary(self, document, tool_names):
        self.drafts += 1
        return super().draft_summary(document, tool_names)


def _record(url="https://duckdb.org/a", text="DuckDB 1.5 salió hoy con mejoras") -> ArticleRecord:
    return ArticleRecord(url=url, title="T", author=None, published_at=NOW, summary_text=text)


def test_run_processes_feeds_and_inserts_articles(db_conn):
    summary = run(db_conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO, _FakeLLM(), DS, NOW, fetcher=_fake_fetcher([_record()]))

    assert isinstance(summary, RunArticlesSummary)
    assert summary.feeds_processed == 1
    assert summary.articles_inserted == 1


def test_run_skips_articles_without_catalog_mentions(db_conn):
    unrelated = _record(text="un artículo que no menciona nada del catálogo")
    summary = run(db_conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO, _FakeLLM(), DS, NOW, fetcher=_fake_fetcher([unrelated]))

    assert summary.articles_inserted == 0


def test_run_is_idempotent(db_conn):
    fetcher = _fake_fetcher([_record()])
    run(db_conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO, _FakeLLM(), DS, NOW, fetcher=fetcher)
    second = run(db_conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO, _FakeLLM(), DS, NOW, fetcher=fetcher)

    assert second.articles_inserted == 0
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM articles")
        assert cur.fetchone()[0] == 1


def test_run_summarizes_top_scored_articles(db_conn):
    summary = run(db_conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO, _FakeLLM(), DS, NOW, fetcher=_fake_fetcher([_record()]))

    assert summary.summaries_accepted == 1
    with db_conn.cursor() as cur:
        cur.execute("SELECT idioma FROM summaries ORDER BY idioma")
        assert [row[0] for row in cur.fetchall()] == ["en", "es"]


def test_run_quarantines_rejected_summary_without_crashing(db_conn):
    summary = run(db_conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO, _FakeLLMRejects(), DS, NOW, fetcher=_fake_fetcher([_record()]))

    assert summary.summaries_rejected == 1
    assert summary.summaries_accepted == 0
    with db_conn.cursor() as cur:
        cur.execute("SELECT source_ref, stage FROM quarantine")
        assert cur.fetchone() == ("article:1", "anchor")


def test_run_survives_llm_exception_during_summarize(db_conn):
    summary = run(db_conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO, _FakeLLMCrashes(), DS, NOW, fetcher=_fake_fetcher([_record()]))

    assert summary.articles_inserted == 1
    assert summary.summaries_accepted == 0
    assert summary.failures == 1
    with db_conn.cursor() as cur:
        cur.execute("SELECT source_ref, stage FROM quarantine")
        assert cur.fetchone() == ("article:1", "summarize")


def test_run_survives_llm_exception_during_entailment(db_conn):
    summary = run(
        db_conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO,
        _FakeLLMEntailmentQuotaExceeded(), DS, NOW, fetcher=_fake_fetcher([_record()]),
    )

    assert summary.summaries_accepted == 1
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM entailment_checks")
        assert cur.fetchone() == (0,)


def test_run_records_source_failure_on_feed_error(db_conn):
    from pipeline.run_articles import run

    catalog = Catalog(tools=[Tool(
        slug="duckdb", name="DuckDB", category="test",
        feeds=[{"kind": "rss", "url": "https://x"}],
    )])

    def failing_fetcher(url, **kwargs):
        raise ValueError("feed roto")

    run(db_conn, catalog, ROADMAP_VACIO, GLOSARIO_VACIO, llm_client=None, ds=DS, now=NOW, fetcher=failing_fetcher)

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

    run(db_conn, catalog, ROADMAP_VACIO, GLOSARIO_VACIO, llm_client=_FakeDiscoveryLLM(), ds=DS, now=NOW,
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

    run(db_conn, catalog, ROADMAP_VACIO, GLOSARIO_VACIO, llm_client=_FakeDiscoveryLLM(), ds=DS, now=NOW,
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

    run(db_conn, catalog, ROADMAP_VACIO, GLOSARIO_VACIO, llm_client=_FakeDiscoveryLLM(), ds=DS, now=NOW,
        fetcher=lambda url, **kwargs: ("{}", [old_record]))

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM tool_candidates WHERE normalized_name = 'fooflow'")
        assert cur.fetchone()[0] == 0


def test_run_mines_glossary_terms_from_articles_that_get_ingested(db_conn):
    class _FakeGlossaryLLM(_FakeLLM):
        def extract_glossary_terms(self, document, known_terms):
            return ["circuit breaker"]

    run(db_conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO, _FakeGlossaryLLM(), DS, NOW,
        fetcher=_fake_fetcher([_record()]))

    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT gc.display_term, count(gcm.id) FROM glossary_candidates gc "
            "JOIN glossary_candidate_mentions gcm ON gcm.candidate_id = gc.id "
            "WHERE gc.normalized_term = 'circuit breaker' GROUP BY gc.display_term"
        )
        display_term, mention_count = cur.fetchone()
    assert display_term == "circuit breaker"
    assert mention_count == 1


def test_run_glossary_mining_filters_terms_already_known_from_roadmap(db_conn):
    from pipeline.roadmap import RoadmapNode

    class _FakeGlossaryLLM(_FakeLLM):
        def extract_glossary_terms(self, document, known_terms):
            return ["Circuit Breaker", "SQL"]

    roadmap_con_sql = Roadmap(nodes=[RoadmapNode(
        slug="sql", tipo="herramienta", nombre="SQL",
        resuelve="x", dominado_cuando="y", nivel=0,
    )])

    run(db_conn, _catalog(), roadmap_con_sql, GLOSARIO_VACIO, _FakeGlossaryLLM(), DS, NOW,
        fetcher=_fake_fetcher([_record()]))

    with db_conn.cursor() as cur:
        cur.execute("SELECT normalized_term FROM glossary_candidates")
        terms = {row[0] for row in cur.fetchall()}
    assert terms == {"circuit breaker"}  # "SQL" ya es un nodo de Rumbo, se filtra


def test_run_does_not_remine_glossary_terms_on_second_run(db_conn):
    class _FakeGlossaryLLM(_FakeLLM):
        def extract_glossary_terms(self, document, known_terms):
            return ["circuit breaker"]

    fetcher = _fake_fetcher([_record()])
    llm = _FakeGlossaryLLM()
    run(db_conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO, llm, DS, NOW, fetcher=fetcher)
    run(db_conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO, llm, DS, NOW, fetcher=fetcher)

    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT count(*) FROM glossary_candidate_mentions gcm "
            "JOIN glossary_candidates gc ON gc.id = gcm.candidate_id "
            "WHERE gc.normalized_term = 'circuit breaker'"
        )
        assert cur.fetchone()[0] == 1  # el artículo ya existía en la segunda corrida, no se re-minó


def test_run_does_not_mine_glossary_when_minar_glosario_is_false(db_conn):
    class _FakeGlossaryLLM(_FakeLLM):
        def extract_glossary_terms(self, document, known_terms):
            return ["circuit breaker"]

    run(db_conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO, _FakeGlossaryLLM(), DS, NOW,
        fetcher=_fake_fetcher([_record()]), minar_glosario=False)

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM glossary_candidates")
        assert cur.fetchone()[0] == 0  # minar_glosario=False desactiva la minería, no solo el filtro


def test_run_glossary_mining_filters_bare_form_of_parenthetical_term(db_conn):
    glosario_con_parentetico = Glosario(terminos=[GlossaryTerm(
        slug="backpressure", termino="Backpressure (contrapresión)", definicion="x", nivel=0,
        fuentes=[GlossarySource(url="https://x", por_que="y")],
    )])

    class _FakeGlossaryLLM(_FakeLLM):
        def extract_glossary_terms(self, document, known_terms):
            return ["backpressure"]

    run(db_conn, _catalog(), ROADMAP_VACIO, glosario_con_parentetico, _FakeGlossaryLLM(), DS, NOW,
        fetcher=_fake_fetcher([_record()]))

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM glossary_candidates WHERE normalized_term = 'backpressure'")
        assert cur.fetchone()[0] == 0  # "backpressure" (forma pelada) ya está cubierto por el término curado


def test_main_survives_invalid_roadmap_yaml_and_disables_mining(monkeypatch):
    import pipeline.run_articles as mod

    monkeypatch.setenv("DATABASE_URL", "postgresql://fake")
    monkeypatch.setenv("GEMINI_API_KEY", "fake")
    monkeypatch.setenv("GEMINI_MODEL_SUMMARY", "fake")
    monkeypatch.setenv("GEMINI_MODEL_JUDGE", "fake")

    def _raise_yaml_error(*args, **kwargs):
        raise yaml.YAMLError("bad indent")

    class _FakeConn:
        def close(self):
            pass

    captured = {}

    def _fake_run(conn, catalog, roadmap, glosario, llm_client, ds, now, minar_glosario=True):
        captured["minar_glosario"] = minar_glosario
        return RunArticlesSummary()

    monkeypatch.setattr(mod, "load_roadmap", _raise_yaml_error)
    monkeypatch.setattr(mod, "connect", lambda url: _FakeConn())
    monkeypatch.setattr(mod, "apply_migrations", lambda conn: None)
    monkeypatch.setattr(mod, "GeminiClient", lambda **kwargs: object())
    monkeypatch.setattr(mod, "run", _fake_run)

    exit_code = mod.main()  # antes del fix: yaml.YAMLError no capturado, esto explotaba

    assert exit_code == 0
    assert captured["minar_glosario"] is False


def _run(conn, llm, records=None):
    fetcher = _fake_fetcher(records if records is not None else [_record()])
    return run(conn, _catalog(), ROADMAP_VACIO, GLOSARIO_VACIO, llm, DS, NOW, fetcher=fetcher)


def _idiomas(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT idioma FROM summaries ORDER BY idioma")
        return [r[0] for r in cur.fetchall()]


def test_failed_translation_leaves_no_partial_summary(db_conn):
    summary = _run(db_conn, _FakeLLMTranslateCrashes())

    assert summary.failures == 1
    assert _idiomas(db_conn) == []
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM claims")
        assert cur.fetchone()[0] == 0
        cur.execute("SELECT source_ref, stage FROM quarantine")
        assert cur.fetchall() == [("article:1", "summarize")]


def test_article_without_summary_is_retried_on_the_next_run(db_conn):
    _run(db_conn, _FakeLLMTranslateCrashes())
    second = _run(db_conn, _FakeLLM())

    assert second.articles_inserted == 0
    assert second.summaries_accepted == 1
    assert _idiomas(db_conn) == ["en", "es"]


def test_rejected_summary_gets_another_chance_inside_the_window(db_conn):
    _run(db_conn, _FakeLLMRejects())
    second = _run(db_conn, _FakeLLM())

    assert second.summaries_accepted == 1
    assert _idiomas(db_conn) == ["en", "es"]


def test_article_outside_the_retry_window_is_not_retried(db_conn):
    _run(db_conn, _FakeLLMTranslateCrashes())
    with db_conn.cursor() as cur:
        cur.execute("UPDATE articles SET ingested_at = %s", (NOW - timedelta(days=10),))
    second = _run(db_conn, _FakeLLM())

    assert second.summaries_accepted == 0
    assert _idiomas(db_conn) == []


def test_article_that_already_has_a_summary_is_not_resummarized(db_conn):
    llm = _CountingLLM()
    _run(db_conn, llm)
    _run(db_conn, llm)

    assert llm.drafts == 1


def test_retry_is_capped_by_top_n_and_prefers_higher_score(db_conn, monkeypatch):
    import pipeline.run_articles as mod

    monkeypatch.setattr(mod, "TOP_N_FOR_SUMMARY", 1)
    records = [_record(url="https://duckdb.org/a"), _record(url="https://duckdb.org/b", text="DuckDB 2.0 y DuckDB de nuevo")]
    _run(db_conn, _FakeLLMTranslateCrashes(), records)
    with db_conn.cursor() as cur:
        cur.execute("UPDATE articles SET relevance_score = CASE WHEN url = 'https://duckdb.org/b' THEN 9 ELSE 1 END")
    _run(db_conn, _FakeLLM(), records)

    with db_conn.cursor() as cur:
        cur.execute("SELECT a.url FROM summaries s JOIN articles a ON a.id = s.article_id WHERE s.idioma = 'es'")
        assert cur.fetchall() == [("https://duckdb.org/b",)]
