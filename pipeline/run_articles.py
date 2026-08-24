"""Entrypoint de artículos: filtra, deduplica, puntúa, resume y traduce.

Separado de run.py (releases) a propósito — Fase 1 no debe arriesgarse a
regresiones por cambios de Fase 2. Comparten fetch.py y db.py.
"""

import logging
import os
import sys
import traceback
from dataclasses import dataclass
from datetime import date, datetime, timezone
from functools import partial
from pathlib import Path

import psycopg
from dotenv import load_dotenv

from pipeline.config import Catalog, load_catalog
from pipeline.db import (
    apply_migrations,
    connect,
    find_duplicate_article,
    quarantine,
    save_raw_fetch,
    sync_feed_sources,
    upsert_article,
    upsert_mentions,
)
from pipeline.dedup import content_fingerprint, normalize_url
from pipeline.entailment import compute_error_rate, sampling_rate_for, select_sample
from pipeline.llm import GeminiClient
from pipeline.mentions import detect_mentions
from pipeline.scoring import score_article
from pipeline.sources.rss import fetch_articles
from pipeline.summarize import summarize_article
from pipeline.translate import translate_summary

TOP_N_FOR_SUMMARY = 15

logger = logging.getLogger("de_radar.articles")


@dataclass
class RunArticlesSummary:
    feeds_processed: int = 0
    articles_inserted: int = 0
    duplicates_skipped: int = 0
    summaries_accepted: int = 0
    summaries_rejected: int = 0
    failures: int = 0


def _has_recent_release(conn: psycopg.Connection, tool_slugs: set[str], now: datetime) -> bool:
    if not tool_slugs:
        return False
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM fct_release WHERE tool_slug = ANY(%s) "
            "AND published_at > %s - interval '3 days' LIMIT 1",
            (list(tool_slugs), now),
        )
        return cur.fetchone() is not None


def _recent_entailment_error_rate(conn: psycopg.Connection, now: datetime) -> float:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT is_entailed FROM entailment_checks WHERE checked_at > %s - interval '7 days'",
            (now,),
        )
        results = [row[0] for row in cur.fetchall()]
    return compute_error_rate(results)


def run(
    conn: psycopg.Connection,
    catalog: Catalog,
    llm_client,
    ds: date,
    now: datetime,
    fetcher=fetch_articles,
) -> RunArticlesSummary:
    summary = RunArticlesSummary()
    feed_refs = sync_feed_sources(conn, catalog)
    tool_names_by_slug = {t.slug: t.name for t in catalog.tools}
    quarantine_fn = partial(quarantine, conn)

    scored_today: list[tuple[float, int]] = []

    for tool_slug, source_id, url in feed_refs:
        summary.feeds_processed += 1
        try:
            payload, records = fetcher(url)
        except Exception as error:
            logger.error("fetch de feed falló | fuente=%s url=%s", tool_slug, url, exc_info=True)
            quarantine(conn, f"{tool_slug}:rss", "fetch", f"{type(error).__name__}: {error}\n{traceback.format_exc()}")
            summary.failures += 1
            continue

        save_raw_fetch(conn, source_id, ds, payload)

        for record in records:
            mentions = detect_mentions(f"{record.title} {record.summary_text}", catalog)
            if not mentions:
                continue

            url_norm = normalize_url(record.url)
            fingerprint = content_fingerprint(record.summary_text)
            if find_duplicate_article(conn, fingerprint, record.summary_text) is not None:
                summary.duplicates_skipped += 1
                continue

            linked = _has_recent_release(conn, mentions, now)
            score = score_article(mentions, record.published_at, now, linked)

            article_id = upsert_article(conn, source_id, record, url_norm, fingerprint, score)
            if article_id is None:
                continue

            upsert_mentions(conn, article_id, mentions)
            summary.articles_inserted += 1
            scored_today.append((score, article_id))

    scored_today.sort(reverse=True)
    top_articles = scored_today[:TOP_N_FOR_SUMMARY]

    new_claim_ids: list[int] = []
    for _, article_id in top_articles:
        with conn.cursor() as cur:
            cur.execute("SELECT id, summary_text FROM articles WHERE id = %s", (article_id,))
            row = cur.fetchone()
            cur.execute(
                "SELECT tool_slug FROM fct_article_mention WHERE article_id = %s", (article_id,)
            )
            slugs = [r[0] for r in cur.fetchall()]

        class _Article:
            id = row[0]
            summary_text = row[1]

        tool_names = [tool_names_by_slug[s] for s in slugs]
        summary_id = summarize_article(_Article(), tool_names, llm_client, quarantine_fn, conn=conn)

        if summary_id is None:
            summary.summaries_rejected += 1
            continue

        summary.summaries_accepted += 1
        with conn.cursor() as cur:
            cur.execute("SELECT text FROM summaries WHERE id = %s", (summary_id,))
            english_text = cur.fetchone()[0]
            spanish_text = translate_summary(english_text, llm_client)
            cur.execute(
                "INSERT INTO summaries (article_id, idioma, text) VALUES (%s, 'es', %s)",
                (article_id, spanish_text),
            )
            cur.execute("SELECT id FROM claims WHERE summary_id = %s", (summary_id,))
            new_claim_ids.extend(r[0] for r in cur.fetchall())

    if new_claim_ids:
        rate = sampling_rate_for(_recent_entailment_error_rate(conn, now))
        sample = select_sample(new_claim_ids, rate=rate)
        with conn.cursor() as cur:
            for claim_id in sample:
                cur.execute("SELECT quoted_text FROM claims WHERE id = %s", (claim_id,))
                quote = cur.fetchone()[0]
                cur.execute("SELECT text FROM summaries WHERE id = (SELECT summary_id FROM claims WHERE id = %s)", (claim_id,))
                summary_text = cur.fetchone()[0]
                is_entailed = llm_client.judge_entailment(quote, summary_text)
                cur.execute(
                    "INSERT INTO entailment_checks (claim_id, is_entailed) VALUES (%s, %s)",
                    (claim_id, is_entailed),
                )

    return summary


def main() -> int:
    load_dotenv()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s", stream=sys.stdout)

    now = datetime.now(timezone.utc)
    conn = connect(os.environ["DATABASE_URL"])
    llm_client = GeminiClient(
        api_key=os.environ["GEMINI_API_KEY"],
        summary_model=os.environ["GEMINI_MODEL_SUMMARY"],
        judge_model=os.environ["GEMINI_MODEL_JUDGE"],
    )
    try:
        apply_migrations(conn)
        summary = run(conn, load_catalog(Path("catalog/tools.yaml")), llm_client, now.date(), now)
    finally:
        conn.close()

    logger.info(
        "corrida de artículos terminada | feeds=%d artículos=%d duplicados=%d resúmenes_ok=%d resúmenes_rechazados=%d fallos=%d",
        summary.feeds_processed, summary.articles_inserted, summary.duplicates_skipped,
        summary.summaries_accepted, summary.summaries_rejected, summary.failures,
    )
    return 1 if summary.failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
