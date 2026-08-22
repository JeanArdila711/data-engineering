import json
from datetime import datetime, timezone
from pathlib import Path

from pipeline.config import Tool
from pipeline.sources.github import ReleaseRecord, _normalize_payload, parse_releases

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
