from pathlib import Path

import pytest

from pipeline.config import Catalog, Tool, load_catalog


def test_load_catalog_parses_tools(tmp_path: Path):
    catalog_file = tmp_path / "tools.yaml"
    catalog_file.write_text(
        "tools:\n"
        "  - slug: duckdb\n"
        "    name: DuckDB\n"
        "    category: query-engine\n"
        "    repo: duckdb/duckdb\n"
        "    aliases: [duck db]\n"
    )

    catalog = load_catalog(catalog_file)

    assert isinstance(catalog, Catalog)
    assert len(catalog.tools) == 1
    assert catalog.tools[0].slug == "duckdb"
    assert catalog.tools[0].aliases == ["duck db"]
    assert catalog.tools[0].vendor is None


def test_load_catalog_rejects_duplicate_slugs(tmp_path: Path):
    catalog_file = tmp_path / "tools.yaml"
    catalog_file.write_text(
        "tools:\n"
        "  - slug: duckdb\n"
        "    name: DuckDB\n"
        "    category: query-engine\n"
        "  - slug: duckdb\n"
        "    name: DuckDB Duplicado\n"
        "    category: query-engine\n"
    )

    with pytest.raises(ValueError, match="duckdb"):
        load_catalog(catalog_file)


def test_tool_requires_slug_name_and_category():
    with pytest.raises(Exception):
        Tool(slug="x")


def test_real_catalog_is_valid():
    catalog = load_catalog(Path("catalog/tools.yaml"))
    assert len(catalog.tools) >= 10
    assert all(t.repo for t in catalog.tools), "toda herramienta de Fase 1 necesita repo"
