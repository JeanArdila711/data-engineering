"""Adaptador de feeds RSS/Atom al modelo interno.

feedparser normaliza RSS 2.0 y Atom a la misma estructura de entrada; este
módulo solo traduce esa estructura a ArticleRecord y descarta lo que no
tiene lo mínimo indispensable (link y fecha).
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from time import struct_time

import feedparser

from pipeline.fetch import fetch


@dataclass(frozen=True)
class ArticleRecord:
    url: str
    title: str
    author: str | None
    published_at: datetime
    summary_text: str


def _to_utc(parsed: struct_time | None) -> datetime | None:
    if parsed is None:
        return None
    return datetime(*parsed[:6], tzinfo=timezone.utc)


def parse_articles(payload: str) -> list[ArticleRecord]:
    feed = feedparser.parse(payload)
    records: list[ArticleRecord] = []

    for entry in feed.entries:
        published_at = _to_utc(entry.get("published_parsed") or entry.get("updated_parsed"))
        link = entry.get("link")
        if not link or published_at is None:
            continue

        summary_text = entry.get("content", [{}])[0].get("value") if entry.get("content") else None
        summary_text = summary_text or entry.get("summary") or ""

        records.append(
            ArticleRecord(
                url=link,
                title=entry.get("title") or "",
                author=entry.get("author"),
                published_at=published_at,
                summary_text=summary_text,
            )
        )

    return records


def fetch_articles(url: str, **kwargs) -> tuple[str, list[ArticleRecord]]:
    result = fetch(url, **kwargs)
    return result.body, parse_articles(result.body)
