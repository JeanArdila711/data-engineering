"""Traducción del resumen ya validado. No re-ancla: no introduce hechos nuevos."""


def translate_summary(english_text: str, llm_client) -> str:
    return llm_client.translate(english_text)
