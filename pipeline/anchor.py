"""Validador de anclaje: la única fuente de verdad de procedencia.

Decisión 12: el LLM devuelve la cita como texto, nunca offsets — son malos
contando caracteres. Este módulo busca el string en el documento guardado y
calcula los offsets él mismo. Si no aparece, se rechaza.
"""

import html
import re
from dataclasses import dataclass

_WHITESPACE = re.compile(r"\s+")


def _normalize(text: str) -> str:
    return _WHITESPACE.sub(" ", html.unescape(text)).strip().lower()


@dataclass(frozen=True)
class AnchorResult:
    ok: bool
    span_start: int | None
    span_end: int | None


def validate_claim(quote: str, document: str) -> AnchorResult:
    if not quote.strip():
        return AnchorResult(ok=False, span_start=None, span_end=None)

    normalized_quote = _normalize(quote)
    normalized_document = _normalize(document)

    index = normalized_document.find(normalized_quote)
    if index == -1:
        return AnchorResult(ok=False, span_start=None, span_end=None)

    return AnchorResult(ok=True, span_start=index, span_end=index + len(normalized_quote))
