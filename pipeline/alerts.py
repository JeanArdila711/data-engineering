"""Envía alertas del pipeline como issues de GitHub: fuentes degradadas y
candidatos de descubrimiento que cruzaron el umbral (decisión 14).

Paso propio de GitHub Actions, separado de la ingesta: un fallo acá nunca
debe tumbar `run.py` ni `run_articles.py`. Usa GITHUB_TOKEN (el que Actions
inyecta con permiso sobre ESTE repo), no GH_API_TOKEN — ese es para leer
releases de repos externos (pipeline/sources/github.py), un scope distinto.
"""

import logging
import os
import sys
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv

from pipeline.db import (
    connect,
    degraded_sources_needing_alert,
    mark_candidate_proposed,
    mark_source_alerted,
    pending_candidates_over_threshold,
)

logger = logging.getLogger("de_radar.alerts")


def _open_issue(repo: str, token: str, title: str, body: str, labels: list[str]) -> None:
    # Sin retry/backoff a propósito: crear un issue NO es idempotente (dos POSTs
    # exitosos crean dos issues), y acá no hay forma de distinguir "se perdió la
    # respuesta pero el issue sí se creó" de "el request nunca llegó". Reintentar
    # a ciegas arriesga duplicar el issue, que es peor que un fallo visible. Si
    # falla, el paso de CI queda en rojo (visible, no silencioso) y el estado en
    # DB (alerted_at / status) no se marca, así que la próxima corrida lo reintenta
    # solo — igual que decisión 15 acepta que el pipeline siga si el LLM está caído.
    response = httpx.post(
        f"https://api.github.com/repos/{repo}/issues",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        json={"title": title, "body": body, "labels": labels},
        timeout=30.0,
    )
    response.raise_for_status()


def send_source_alerts(conn, repo: str, token: str, now: datetime, opener=_open_issue) -> int:
    """Abre un issue por fuente degradada sin alertar. Devuelve cuántos abrió."""
    sent = 0
    for source_id, tool_slug, kind in degraded_sources_needing_alert(conn):
        opener(
            repo, token,
            title=f"Fuente degradada: {tool_slug} ({kind})",
            body=f"La fuente `{tool_slug}:{kind}` lleva 3 o más corridas fallando seguidas.",
            labels=["source-health"],
        )
        mark_source_alerted(conn, source_id, now)
        sent += 1
    return sent


def send_candidate_alerts(conn, repo: str, token: str, opener=_open_issue) -> int:
    """Abre un issue por candidato que cruzó el umbral. Devuelve cuántos abrió."""
    sent = 0
    for candidate_id, name, mentions, url in pending_candidates_over_threshold(conn):
        opener(
            repo, token,
            title=f"Candidato de catálogo: {name}",
            body=(
                f"`{name}` apareció mencionado en {mentions} artículos sin estar en el catálogo.\n\n"
                f"Ejemplo: {url}\n\nSi aplica, agregalo a `catalog/tools.yaml`."
            ),
            labels=["catalog-candidate"],
        )
        mark_candidate_proposed(conn, candidate_id)
        sent += 1
    return sent


def main() -> int:
    load_dotenv()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s", stream=sys.stdout)

    now = datetime.now(timezone.utc)
    conn = connect(os.environ["DATABASE_URL"])
    repo = os.environ["GITHUB_REPOSITORY"]
    token = os.environ["GITHUB_TOKEN"]
    try:
        sources_alerted = send_source_alerts(conn, repo, token, now)
        candidates_alerted = send_candidate_alerts(conn, repo, token)
    finally:
        conn.close()

    logger.info("alertas enviadas | fuentes=%d candidatos=%d", sources_alerted, candidates_alerted)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
