from pipeline.discovery import extract_candidate_names


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
