"""Muestreo determinista para el juez de entailment (decisión 12).

La selección no puede depender de random sin semilla: dos corridas con los
mismos claim_ids deben elegir la misma muestra. Se ordena por id y se toma
cada k-ésimo elemento, en vez de un random.sample sin control de semilla.
"""


def select_sample(claim_ids: list[int], rate: float = 0.10, minimum: int = 5) -> list[int]:
    if not claim_ids:
        return []

    ordered = sorted(claim_ids)
    target = max(int(len(ordered) * rate), min(minimum, len(ordered)))
    step = max(len(ordered) // target, 1)
    return ordered[::step][:target]


def compute_error_rate(results: list[bool]) -> float:
    if not results:
        return 0.0
    errors = sum(1 for ok in results if not ok)
    return round(errors / len(results), 4)


def sampling_rate_for(recent_error_rate: float, threshold: float = 0.05) -> float:
    return 1.0 if recent_error_rate > threshold else 0.10
