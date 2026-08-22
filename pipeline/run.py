"""Entrypoint del pipeline: orquesta el barrido del catálogo.

Es el único módulo que sabe en qué orden ocurren las cosas. El fallo de una
fuente no afecta a las demás: se aísla, se registra y el barrido sigue.
"""

import logging
import os
import sys
import traceback
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path

import psycopg
from dotenv import load_dotenv

from pipeline.config import Catalog, load_catalog
from pipeline.db import (
    apply_migrations,
    connect,
    quarantine,
    save_raw_fetch,
    sync_catalog,
    sync_sources,
    upsert_releases,
)
from pipeline.sources.github import fetch_releases

DEGRADED_AFTER_FAILURES = 3

logger = logging.getLogger("de_radar")


@dataclass
class RunSummary:
    tools_processed: int = 0
    releases_inserted: int = 0
    failures: int = 0


def _record_failure(conn: psycopg.Connection, tool_slug: str, source_id: int, error: Exception) -> None:
    quarantine(
        conn,
        source_ref=f"{tool_slug}:github_releases",
        stage="fetch",
        error=f"{type(error).__name__}: {error}\n{traceback.format_exc()}",
        payload=None,
    )
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE sources SET consecutive_failures = consecutive_failures + 1, "
            "is_degraded = (consecutive_failures + 1) >= %s WHERE id = %s",
            (DEGRADED_AFTER_FAILURES, source_id),
        )


def _record_success(conn: psycopg.Connection, source_id: int, now: datetime) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE sources SET consecutive_failures = 0, is_degraded = FALSE, last_success_at = %s "
            "WHERE id = %s",
            (now, source_id),
        )


def run(
    conn: psycopg.Connection,
    catalog: Catalog,
    token: str,
    ds: date,
    now: datetime,
    fetcher=fetch_releases,
) -> RunSummary:
    """Barre el catálogo completo y devuelve el resumen de la corrida."""
    sync_catalog(conn, catalog, now)
    source_ids = sync_sources(conn, catalog)
    summary = RunSummary()

    for tool in catalog.tools:
        source_id = source_ids.get(tool.slug)
        if source_id is None:
            continue

        summary.tools_processed += 1
        try:
            payload, records = fetcher(tool, token)
        except Exception as error:
            logger.error(
                "fetch falló | herramienta=%s fuente=github_releases ds=%s",
                tool.slug,
                ds,
                exc_info=True,
            )
            _record_failure(conn, tool.slug, source_id, error)
            summary.failures += 1
            continue

        save_raw_fetch(conn, source_id, ds, payload)
        summary.releases_inserted += upsert_releases(conn, records)
        _record_success(conn, source_id, now)

    return summary


def main() -> int:
    load_dotenv()
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        stream=sys.stdout,
    )

    dsn = os.environ["DATABASE_URL"]
    token = os.environ["GH_API_TOKEN"]
    now = datetime.now(timezone.utc)

    conn = connect(dsn)
    try:
        apply_migrations(conn)
        summary = run(conn, load_catalog(Path("catalog/tools.yaml")), token, now.date(), now)
    finally:
        conn.close()

    logger.info(
        "corrida terminada | herramientas=%d releases_nuevos=%d fallos=%d",
        summary.tools_processed,
        summary.releases_inserted,
        summary.failures,
    )
    return 1 if summary.failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
