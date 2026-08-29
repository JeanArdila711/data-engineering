"""Sincroniza el grafo de la ruta al Postgres.

No toca la red: lee un archivo del repo y escribe a la base. Por eso no
necesita salud de fuentes ni reintentos — no hay fuente externa que falle.
Si el grafo no valida, la corrida falla sin escribir nada.
"""

import logging
import os
import sys
from pathlib import Path

import psycopg
from dotenv import load_dotenv

from pipeline.config import load_catalog
from pipeline.db import apply_migrations, connect, sync_roadmap
from pipeline.roadmap import Roadmap, RoadmapError, load_roadmap

logger = logging.getLogger("de_radar.roadmap")


def run(conn: psycopg.Connection, roadmap: Roadmap) -> int:
    """Sincroniza el grafo y devuelve cuántos nodos quedaron."""
    sync_roadmap(conn, roadmap)
    return len(roadmap.nodes)


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
        nodos = run(conn, roadmap)
    finally:
        conn.close()

    sin_experiencia = sum(1 for n in roadmap.nodes if n.lo_vi_romperse is None)
    logger.info("grafo sincronizado | nodos=%d sin_experiencia=%d", nodos, sin_experiencia)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
