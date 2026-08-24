"""Filtro determinista: ¿este texto menciona alguna herramienta del catálogo?

Decisión 15: si la respuesta es no, el artículo no llega al LLM ni se
persiste — el modelo de datos solo tiene sentido enganchado a entidades.
"""

import re

from pipeline.config import Catalog


def detect_mentions(text: str, catalog: Catalog) -> set[str]:
    matched: set[str] = set()
    for tool in catalog.tools:
        names = [tool.name, *tool.aliases]
        pattern = "|".join(re.escape(n) for n in names)
        if re.search(rf"\b(?:{pattern})\b", text, re.IGNORECASE):
            matched.add(tool.slug)
    return matched
