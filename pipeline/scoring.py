"""Score de relevancia: heurística determinista, sin LLM.

Decisión 18: el LLM solo desempata la franja dudosa cerca del corte
(orquestado en run_articles.py), nunca puntúa todo — no es reproducible
entre corridas y es difícil de depurar cuando puntea raro.
"""

from datetime import datetime

_RECENCY_HALF_LIFE_DAYS = 3.0


def score_article(
    mentions: set[str],
    published_at: datetime,
    now: datetime,
    linked_to_release: bool,
) -> float:
    mention_signal = min(len(mentions) / 3, 1.0)

    age_days = max((now - published_at).total_seconds() / 86400, 0.0)
    recency_signal = 0.5 ** (age_days / _RECENCY_HALF_LIFE_DAYS)

    release_signal = 1.0 if linked_to_release else 0.0

    return round(0.5 * mention_signal + 0.3 * recency_signal + 0.2 * release_signal, 4)
