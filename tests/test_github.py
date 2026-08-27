import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

import httpx

from pipeline.config import Tool
from pipeline.sources.github import ReleaseRecord, _normalize_payload, fetch_releases, parse_releases

FIXTURE = Path("tests/fixtures/github_releases_duckdb.json")
TOOL = Tool(slug="duckdb", name="DuckDB", category="query-engine", repo="duckdb/duckdb")


def test_parse_releases_returns_records():
    records = parse_releases(TOOL, FIXTURE.read_text())

    assert records
    assert all(isinstance(r, ReleaseRecord) for r in records)
    assert all(r.tool_slug == "duckdb" for r in records)


def test_parse_releases_normalizes_versions():
    records = parse_releases(TOOL, FIXTURE.read_text())
    for record in records:
        assert not record.version.startswith("v")
        assert record.version.count(".") >= 2


def test_parse_releases_parses_published_at_as_utc():
    records = parse_releases(TOOL, FIXTURE.read_text())
    assert all(r.published_at.tzinfo == timezone.utc for r in records)


def test_normalize_payload_ignores_volatile_asset_fields():
    """GitHub cambia download_count por cada descarga real, sin releases nuevos.

    Si el hash de content_hash se calculara sobre el JSON crudo, cada corrida
    generaría una fila nueva en raw_fetches sin que haya novedad real.
    """
    entry = {
        "tag_name": "v1.0.0",
        "name": "1.0.0",
        "body": "changelog",
        "draft": False,
        "prerelease": False,
        "published_at": "2026-01-01T00:00:00Z",
        "html_url": "https://github.com/x/y/releases/tag/v1.0.0",
        "id": 1,
    }
    payload_a = json.dumps([{**entry, "assets": [{"download_count": 10}], "reactions": {"+1": 3}}])
    payload_b = json.dumps([{**entry, "assets": [{"download_count": 42}], "reactions": {"+1": 9}}])

    assert _normalize_payload(payload_a) == _normalize_payload(payload_b)


def test_normalize_payload_changes_when_release_content_changes():
    payload_a = json.dumps([{"tag_name": "v1.0.0", "body": "a", "draft": False}])
    payload_b = json.dumps([{"tag_name": "v1.0.1", "body": "b", "draft": False}])

    assert _normalize_payload(payload_a) != _normalize_payload(payload_b)


def test_parse_releases_skips_drafts():
    payload = json.dumps(
        [
            {
                "tag_name": "v1.0.0",
                "draft": True,
                "published_at": "2026-01-01T00:00:00Z",
                "html_url": "https://example.com/1",
                "body": "",
            },
            {
                "tag_name": "v0.9.0",
                "draft": False,
                "published_at": "2025-12-01T00:00:00Z",
                "html_url": "https://example.com/2",
                "body": "",
            },
        ]
    )

    records = parse_releases(TOOL, payload)

    assert [r.version for r in records] == ["0.9.0"]


def test_parse_releases_logs_when_skipping_unparseable_entry(caplog):
    payload = json.dumps(
        [
            {
                "tag_name": "nightly",
                "draft": False,
                "published_at": "2026-01-01T00:00:00Z",
                "html_url": "https://example.com/1",
                "body": "",
            }
        ]
    )

    with caplog.at_level("WARNING"):
        parse_releases(TOOL, payload)

    assert "release descartado" in caplog.text
    assert "duckdb" in caplog.text


def test_parse_releases_skips_unparseable_versions():
    payload = json.dumps(
        [
            {
                "tag_name": "nightly",
                "draft": False,
                "published_at": "2026-01-01T00:00:00Z",
                "html_url": "https://example.com/1",
                "body": "",
            }
        ]
    )

    assert parse_releases(TOOL, payload) == []


def test_parse_releases_skips_entries_without_published_at():
    payload = json.dumps(
        [
            {
                "tag_name": "v1.0.0",
                "draft": False,
                "published_at": None,
                "html_url": "https://example.com/1",
                "body": "",
            }
        ]
    )

    assert parse_releases(TOOL, payload) == []


def test_parse_releases_detects_breaking_changes():
    payload = json.dumps(
        [
            {
                "tag_name": "v2.0.0",
                "draft": False,
                "published_at": "2026-01-01T00:00:00Z",
                "html_url": "https://example.com/1",
                "body": "### Breaking Changes\n* Removed the legacy API",
            }
        ]
    )

    record = parse_releases(TOOL, payload)[0]

    assert record.has_breaking is True
    assert record.changes[0].text == "Removed the legacy API"


def _entry(n: int) -> dict:
    return {
        "tag_name": f"v0.0.{n}",
        "draft": False,
        "published_at": "2026-01-01T00:00:00Z",
        "html_url": f"https://example.com/{n}",
        "body": "",
    }


def test_fetch_releases_paginates_full_history():
    """Sin paginar, una herramienta con más releases que una sola página
    (ej. Airflow, Kafka) pierde su historial viejo para siempre — GitHub sí
    soporta paginar, a diferencia de un feed RSS (decisión 11)."""
    calls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        page = int(parse_qs(urlsplit(str(request.url)).query)["page"][0])
        per_page = int(parse_qs(urlsplit(str(request.url)).query)["per_page"][0])
        if page == 1:
            return httpx.Response(200, json=[_entry(i) for i in range(per_page)])
        if page == 2:
            return httpx.Response(200, json=[_entry(i) for i in range(per_page, per_page + 30)])
        raise AssertionError("no debería pedir una tercera página: la segunda ya vino incompleta")

    payload, records = fetch_releases(TOOL, "token", transport=httpx.MockTransport(handler))

    assert len(calls) == 2
    assert len(records) == 130
    assert len(json.loads(payload)) == 130  # el payload crudo combina ambas páginas


def test_fetch_releases_stops_at_first_partial_page():
    calls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        return httpx.Response(200, json=[_entry(0), _entry(1)])  # menos que per_page, es la última

    _, records = fetch_releases(TOOL, "token", transport=httpx.MockTransport(handler))

    assert len(calls) == 1
    assert len(records) == 2


def test_parse_releases_keeps_original_body():
    payload = json.dumps(
        [
            {
                "tag_name": "v1.0.0",
                "draft": False,
                "published_at": "2026-01-01T00:00:00Z",
                "html_url": "https://example.com/1",
                "body": "texto original exacto",
            }
        ]
    )

    assert parse_releases(TOOL, payload)[0].body == "texto original exacto"
