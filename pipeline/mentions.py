"""Filtro determinista: ¿este texto menciona alguna herramienta del catálogo?

Decisión 15: si la respuesta es no, el artículo no se persiste en `articles`
— el modelo de datos solo tiene sentido enganchado a entidades. Desde la
Fase 4, un texto sin menciones sí puede llegar al LLM por otra vía: la
minería de candidatos de pipeline/discovery.py, que busca herramientas
nuevas no catalogadas en vez de resumir el artículo.
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
