"""Minería de candidatos a catálogo: detecta herramientas no catalogadas
mencionadas en artículos que hoy no mencionan ninguna del catálogo.

Solo corre sobre artículos de feeds de herramientas ya catalogadas (decisión
15) — el dominio ya está filtrado, así que el costo y el ruido son bajos.
No confía en que el LLM respete la exclusión de nombres conocidos al pie de
la letra: filtra acá.
"""


def extract_candidate_names(text: str, known_names: list[str], llm_client) -> list[str]:
    raw = llm_client.extract_candidates(text, known_names)
    known_lower = {n.strip().casefold() for n in known_names}
    seen: set[str] = set()
    candidates: list[str] = []
    for name in raw:
        cleaned = name.strip()
        key = cleaned.casefold()
        if not cleaned or key in known_lower or key in seen:
            continue
        seen.add(key)
        candidates.append(cleaned)
    return candidates
