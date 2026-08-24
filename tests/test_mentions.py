from pipeline.config import Catalog, Tool
from pipeline.mentions import detect_mentions

CATALOG = Catalog(
    tools=[
        Tool(slug="duckdb", name="DuckDB", category="x", aliases=["duck db"]),
        Tool(slug="dbt-core", name="dbt Core", category="x", aliases=["dbt"]),
    ]
)


def test_detects_mention_by_name():
    assert detect_mentions("DuckDB lanzó una nueva versión", CATALOG) == {"duckdb"}


def test_detects_mention_by_alias():
    assert detect_mentions("usamos dbt para transformar", CATALOG) == {"dbt-core"}


def test_is_case_insensitive():
    assert detect_mentions("DUCKDB es rápido", CATALOG) == {"duckdb"}


def test_respects_word_boundaries():
    assert detect_mentions("dbtx no es dbt", CATALOG) == {"dbt-core"}


def test_returns_multiple_tools():
    assert detect_mentions("DuckDB y dbt juntos", CATALOG) == {"duckdb", "dbt-core"}


def test_returns_empty_set_when_no_match():
    assert detect_mentions("un artículo sobre otra cosa", CATALOG) == set()
