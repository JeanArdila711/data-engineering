"""Adaptador de la API de GitHub Releases al modelo interno.

Traduce un formato externo a ReleaseRecord y no hace nada más: no persiste,
no decide qué herramientas existen, no orquesta.
"""

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone

from pipeline.changes import ExtractedChange, extract_changes, has_breaking_changes
from pipeline.config import Tool
from pipeline.fetch import fetch
from pipeline.versions import normalize_version

logger = logging.getLogger("de_radar.github")

API_TEMPLATE = "https://api.github.com/repos/{repo}/releases?per_page={per_page}&page={page}"

# GitHub sí soporta paginar su histórico completo, a diferencia de un feed RSS
# (decisión 11) — sin esto, una herramienta con más releases que una sola
# página (Airflow, Kafka llevan años) se queda con el historial viejo sin
# traer para siempre. El tope evita paginar sin límite si algún repo tiene
# un historial anormalmente largo.
_PER_PAGE = 100
_MAX_PAGES = 10

# Campos estables de un release: sin assets ni reactions, que cambian con cada
# descarga o reacción real y romperían el particionamiento de raw_fetches por
# content_hash (misma lista de releases, hash distinto cada corrida).
_STABLE_FIELDS = (
    "id",
    "tag_name",
    "name",
    "body",
    "draft",
    "prerelease",
    "published_at",
    "created_at",
    "html_url",
)


def _normalize_payload(raw_body: str) -> str:
    """Quita campos volátiles del JSON de GitHub antes de guardarlo como raw."""
    entries = json.loads(raw_body)
    stripped = [{field: entry.get(field) for field in _STABLE_FIELDS} for entry in entries]
    return json.dumps(stripped, sort_keys=True)


@dataclass(frozen=True)
class ReleaseRecord:
    tool_slug: str
    version: str
    published_at: datetime
    source_url: str
    body: str
    has_breaking: bool
    changes: list[ExtractedChange] = field(default_factory=list)


def _parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def parse_releases(tool: Tool, payload: str) -> list[ReleaseRecord]:
    """Convierte el JSON de la API en registros válidos, descartando lo que no lo es."""
    entries = json.loads(payload)
    records: list[ReleaseRecord] = []

    for entry in entries:
        if entry.get("draft"):
            continue

        version = normalize_version(entry.get("tag_name") or "")
        published_at = _parse_timestamp(entry.get("published_at"))
        if version is None or published_at is None:
            # Descarte silencioso = imposible distinguir "release rara sin
            # tag" de "GitHub cambió el shape del JSON" sin mirar esto.
            logger.warning(
                "release descartado por campo ilegible | herramienta=%s tag_name=%r published_at=%r",
                tool.slug, entry.get("tag_name"), entry.get("published_at"),
            )
            continue

        body = entry.get("body") or ""
        records.append(
            ReleaseRecord(
                tool_slug=tool.slug,
                version=version,
                published_at=published_at,
                source_url=entry.get("html_url") or "",
                body=body,
                has_breaking=has_breaking_changes(body),
                changes=extract_changes(body),
            )
        )

    return records


def fetch_releases(tool: Tool, token: str, **kwargs) -> tuple[str, list[ReleaseRecord]]:
    """Trae los releases de una herramienta, paginando hasta agotar el
    historial o llegar a _MAX_PAGES. Devuelve el payload combinado (todas las
    páginas) junto a los registros parseados.
    """
    if not tool.repo:
        raise ValueError(f"{tool.slug} no tiene repo configurado")

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    all_entries: list[dict] = []
    for page in range(1, _MAX_PAGES + 1):
        result = fetch(
            API_TEMPLATE.format(repo=tool.repo, per_page=_PER_PAGE, page=page),
            headers=headers,
            **kwargs,
        )
        page_entries = json.loads(result.body)
        all_entries.extend(page_entries)
        if len(page_entries) < _PER_PAGE:
            break

    combined_payload = json.dumps(all_entries)
    return _normalize_payload(combined_payload), parse_releases(tool, combined_payload)
