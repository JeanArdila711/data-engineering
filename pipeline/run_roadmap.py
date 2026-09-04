"""Sincroniza el grafo de la ruta al Postgres y genera los párrafos de cada ruta.

Lee un archivo del repo y escribe a la base. Si el grafo no valida, la corrida
falla sin escribir nada. Los párrafos (Fase 4) son lo único que toca la red:
su fallo se loguea y la corrida sigue en verde — la ruta queda sincronizada
igual, y mañana se reintenta.
"""

import logging
import os
import sys
from pathlib import Path

import psycopg
from dotenv import load_dotenv

from pipeline import blurbs
from pipeline.config import load_catalog
from pipeline.db import apply_migrations, connect, sync_roadmap
from pipeline.llm import GeminiClient
from pipeline.roadmap import Roadmap, RoadmapError, load_roadmap

logger = logging.getLogger("de_radar.roadmap")


def run(conn: psycopg.Connection, roadmap: Roadmap, llm=None) -> int:
    """Sincroniza el grafo y devuelve cuántos nodos quedaron. Con `llm`, además
    genera los párrafos; sin él, los omite (corrida local sin GEMINI_API_KEY)."""
    sync_roadmap(conn, roadmap)
    if llm is None:
        logger.info("parrafos | omitidos: sin GEMINI_API_KEY")
        return len(roadmap.nodes)
    try:
        stats = blurbs.generar(conn, roadmap, llm)
        logger.info(
            "parrafos | generados=%d reutilizados=%d rechazados=%d fallidos=%d",
            stats["generados"], stats["reutilizados"], stats["rechazados"], stats["fallidos"],
        )
    except Exception:
        logger.exception("no se pudieron generar los párrafos; la ruta quedó sincronizada igual")
    return len(roadmap.nodes)


def _llm_desde_env():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    return GeminiClient(
        api_key=api_key,
        summary_model=os.environ["GEMINI_MODEL_SUMMARY"],
        judge_model=os.environ["GEMINI_MODEL_JUDGE"],
    )


def main() -> int:
    load_dotenv()
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        stream=sys.stdout,
    )

    dsn = os.environ["DATABASE_URL"]
    catalog = load_catalog(Path("catalog/tools.yaml"))

    try:
        roadmap = load_roadmap(Path("catalog/roadmap.yaml"), catalog)
    except RoadmapError:
        logger.exception("el grafo de la ruta no es válido, no se escribió nada")
        return 1

    conn = connect(dsn)
    try:
        apply_migrations(conn)
        nodos = run(conn, roadmap, llm=_llm_desde_env())
    finally:
        conn.close()

    sin_experiencia = sum(1 for n in roadmap.nodes if n.lo_vi_romperse is None)
    logger.info("grafo sincronizado | nodos=%d sin_experiencia=%d", nodos, sin_experiencia)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
