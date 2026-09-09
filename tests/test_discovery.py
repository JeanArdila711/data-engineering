from pipeline.discovery import extract_candidate_names, extract_glossary_term_candidates


class _FakeLLM:
    def __init__(self, candidates):
        self._candidates = candidates

    def extract_candidates(self, document, known_names):
        return self._candidates


def test_extract_candidate_names_returns_llm_candidates():
    result = extract_candidate_names("texto", ["dbt", "Airflow"], _FakeLLM(["Fooflow"]))
    assert result == ["Fooflow"]


def test_extract_candidate_names_filters_known_names_case_insensitive():
    result = extract_candidate_names("texto", ["dbt"], _FakeLLM(["DBT", "Fooflow"]))
    assert result == ["Fooflow"]


def test_extract_candidate_names_dedupes_case_insensitive():
    result = extract_candidate_names("texto", [], _FakeLLM(["Fooflow", "fooflow", "FOOFLOW"]))
    assert result == ["Fooflow"]


def test_extract_candidate_names_drops_blank_strings():
    result = extract_candidate_names("texto", [], _FakeLLM(["", "   ", "Fooflow"]))
    assert result == ["Fooflow"]


class _FakeGlossaryLLM:
    def __init__(self, terms):
        self._terms = terms

    def extract_glossary_terms(self, document, known_terms):
        return self._terms


def test_extract_glossary_term_candidates_returns_llm_terms():
    result = extract_glossary_term_candidates(
        "texto", ["grano", "backpressure"], _FakeGlossaryLLM(["circuit breaker"])
    )
    assert result == ["circuit breaker"]


def test_extract_glossary_term_candidates_filters_known_terms_case_insensitive():
    result = extract_glossary_term_candidates(
        "texto", ["Grano"], _FakeGlossaryLLM(["GRANO", "circuit breaker"])
    )
    assert result == ["circuit breaker"]


def test_extract_glossary_term_candidates_dedupes_case_insensitive():
    result = extract_glossary_term_candidates(
        "texto", [], _FakeGlossaryLLM(["Circuit Breaker", "circuit breaker"])
    )
    assert result == ["Circuit Breaker"]


def test_extract_glossary_term_candidates_drops_blank_strings():
    result = extract_glossary_term_candidates("texto", [], _FakeGlossaryLLM(["", "   ", "circuit breaker"]))
    assert result == ["circuit breaker"]
