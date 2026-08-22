"""Extracción heurística de cambios desde el cuerpo de un release.

Fase 1 no usa LLM. Los proyectos serios marcan sus breaking changes con
secciones explícitas; cuando no lo hacen, devolvemos vacío en vez de
adivinar. Un falso negativo es preferible a inventar un breaking change.
"""

import re
from dataclasses import dataclass
from typing import Literal

ChangeKind = Literal["breaking", "feature", "fix", "deprecation"]

_SECTION_KINDS: dict[ChangeKind, tuple[str, ...]] = {
    "breaking": ("breaking change", "breaking changes", "breaking"),
    "deprecation": ("deprecation", "deprecations", "deprecated"),
    "feature": ("feature", "features", "new features", "what's new", "added"),
    "fix": ("bug fix", "bug fixes", "fixes", "fixed"),
}

_HEADER_RE = re.compile(r"^#{1,6}\s*(?P<title>.+?)\s*$", re.MULTILINE)
_BULLET_RE = re.compile(r"^\s*[-*+]\s+(?P<text>.+?)\s*$")
_BANG_RE = re.compile(r"^\s*\w+(\([^)]*\))?!:", re.MULTILINE)


@dataclass(frozen=True)
class ExtractedChange:
    kind: ChangeKind
    text: str


def _kind_for_header(title: str) -> ChangeKind | None:
    normalized = title.strip().lower().rstrip(":")
    for kind, labels in _SECTION_KINDS.items():
        if normalized in labels:
            return kind
    return None


def _clean_bullet(text: str) -> str:
    """Quita markdown inline básico sin alterar el contenido."""
    return text.replace("`", "").strip()


def extract_changes(body: str) -> list[ExtractedChange]:
    """Recorre las secciones del cuerpo y clasifica los bullets de cada una."""
    if not body or not body.strip():
        return []

    headers = list(_HEADER_RE.finditer(body))
    changes: list[ExtractedChange] = []

    for index, header in enumerate(headers):
        kind = _kind_for_header(header.group("title"))
        if kind is None:
            continue

        start = header.end()
        end = headers[index + 1].start() if index + 1 < len(headers) else len(body)

        for line in body[start:end].splitlines():
            bullet = _BULLET_RE.match(line)
            if bullet:
                changes.append(ExtractedChange(kind=kind, text=_clean_bullet(bullet.group("text"))))

    return changes


def has_breaking_changes(body: str) -> bool:
    """True si hay sección de breaking changes o convención `tipo!:`."""
    if not body:
        return False
    if any(c.kind == "breaking" for c in extract_changes(body)):
        return True
    return bool(_BANG_RE.search(body))
