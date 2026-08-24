"""Orquesta resumen + validación de anclaje para un artículo.

Todo o nada: si una sola cita no ancla, el resumen completo se descarta a
cuarentena — no se publican resúmenes parcialmente verificados.
"""

from pipeline.anchor import validate_claim


def summarize_article(article, tool_names: list[str], llm_client, quarantine_fn, conn=None) -> int | None:
    draft = llm_client.draft_summary(article.summary_text, tool_names)

    anchored = []
    for quote in draft.quotes:
        result = validate_claim(quote, article.summary_text)
        if not result.ok:
            quarantine_fn(
                source_ref=f"article:{article.id}",
                stage="anchor",
                error=f"cita no encontrada en el documento: {quote!r}",
                payload=draft.text,
            )
            return None
        anchored.append((quote, result.span_start, result.span_end))

    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO summaries (article_id, idioma, text) VALUES (%s, 'en', %s) RETURNING id",
            (article.id, draft.text),
        )
        summary_id = cur.fetchone()[0]
        for quote, start, end in anchored:
            cur.execute(
                "INSERT INTO claims (summary_id, quoted_text, span_start, span_end) VALUES (%s, %s, %s, %s)",
                (summary_id, quote, start, end),
            )

    return summary_id
