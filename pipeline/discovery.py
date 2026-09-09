"""Minería de candidatos: detecta nombres —de herramientas o de jerga del
glosario— que hoy no están catalogados, a partir de texto que el pipeline ya
ingirió.

Dos usos del mismo patrón. `extract_candidate_names` busca herramientas no
catalogadas en artículos que NO mencionan ninguna del catálogo (Fase 4 de
DE Radar, decisión 20): el dominio ya está filtrado porque vienen de un feed
de una herramienta catalogada, así que el costo y el ruido son bajos.
`extract_glossary_term_candidates` busca jerga técnica no definida en
artículos que SÍ se ingirieron (Fase 2 de Glosario) — acotado a los mismos
artículos del día que ya reciben un resumen por LLM, así que no agrega una
llamada nueva sin presupuesto (decisión 15).

Ninguna de las dos confía en que el LLM respete la exclusión de nombres
conocidos al pie de la letra: el filtro corre acá, en código.
"""


def _nuevos_sin_duplicar(raw: list[str], known: list[str]) -> list[str]:
    known_lower = {n.strip().casefold() for n in known}
    seen: set[str] = set()
    resultado: list[str] = []
    for name in raw:
        cleaned = name.strip()
        key = cleaned.casefold()
        if not cleaned or key in known_lower or key in seen:
            continue
        seen.add(key)
        resultado.append(cleaned)
    return resultado


def extract_candidate_names(text: str, known_names: list[str], llm_client) -> list[str]:
    raw = llm_client.extract_candidates(text, known_names)
    return _nuevos_sin_duplicar(raw, known_names)


def extract_glossary_term_candidates(text: str, known_terms: list[str], llm_client) -> list[str]:
    raw = llm_client.extract_glossary_terms(text, known_terms)
    return _nuevos_sin_duplicar(raw, known_terms)
