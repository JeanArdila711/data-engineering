from datetime import timezone
from pathlib import Path

from pipeline.sources.rss import ArticleRecord, parse_articles

FIXTURE = Path("tests/fixtures/rss_duckdb.xml")


def test_parse_articles_returns_records():
    records = parse_articles(FIXTURE.read_text())
    assert records
    assert all(isinstance(r, ArticleRecord) for r in records)


def test_parse_articles_has_utc_dates():
    records = parse_articles(FIXTURE.read_text())
    assert all(r.published_at.tzinfo is not None for r in records)
    assert all(r.published_at.astimezone(timezone.utc) == r.published_at for r in records)


def test_parse_articles_skips_entries_without_link_or_date():
    payload = """<?xml version="1.0"?>
    <rss version="2.0"><channel>
      <item><title>Sin fecha</title><link>https://x.com/a</link></item>
    </channel></rss>"""
    assert parse_articles(payload) == []


def test_parse_articles_keeps_raw_summary_text():
    payload = """<?xml version="1.0"?>
    <rss version="2.0"><channel>
      <item>
        <title>Post</title>
        <link>https://x.com/a</link>
        <pubDate>Mon, 01 Jan 2026 00:00:00 GMT</pubDate>
        <description>texto original exacto</description>
      </item>
    </channel></rss>"""
    assert parse_articles(payload)[0].summary_text == "texto original exacto"
