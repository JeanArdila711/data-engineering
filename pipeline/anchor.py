"""Validador de anclaje: la única fuente de verdad de procedencia.

Decisión 12: el LLM devuelve la cita como texto, nunca offsets — son malos
contando caracteres. Este módulo busca el string en el documento guardado y
calcula los offsets él mismo. Si no aparece, se rechaza.
"""

import html
import re
from dataclasses import dataclass

_WHITESPACE = re.compile(r"\s+")
# Los feeds traen HTML. Una cita es texto del artículo, no markup: sin esto, una
# cita literal como "iceberg-rust." no ancla contra "<a href=..>iceberg-rust</a>.",
# y una que solo coincide con un href sí anclaría. La letra tras "<" evita
# borrar comparaciones como "a < b and c > d".
_BLOCK_TAG = re.compile(r"</?(?:p|br|div|li|ul|ol|h[1-6]|tr|td|th|table|blockquote|pre|hr)\b[^>]*>", re.I)
_TAG = re.compile(r"<!--.*?-->|</?[a-zA-Z][^>]*>", re.S)


def _normalize(text: str) -> str:
    # Las etiquetas se quitan antes de desescapar: "&lt;b&gt;" es texto, no una etiqueta.
    # Las de bloque se reemplazan por espacio (no pegar párrafos); las inline por nada
    # (para que "<a>iceberg-rust</a>." siga siendo "iceberg-rust.").
    text = _TAG.sub("", _BLOCK_TAG.sub(" ", text))
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
    if not normalized_quote:
        return AnchorResult(ok=False, span_start=None, span_end=None)
    normalized_document = _normalize(document)

    index = normalized_document.find(normalized_quote)
    if index == -1:
        return AnchorResult(ok=False, span_start=None, span_end=None)

    return AnchorResult(ok=True, span_start=index, span_end=index + len(normalized_quote))
