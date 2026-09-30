from pipeline.anchor import validate_claim


def test_accepts_exact_substring():
    result = validate_claim("texto citado", "un documento con texto citado dentro")
    assert result.ok is True
    assert result.span_start is not None and result.span_end is not None


def test_computes_correct_offsets():
    doc = "prefijo. texto citado. sufijo"
    result = validate_claim("texto citado", doc)
    assert doc[result.span_start:result.span_end] == "texto citado"


def test_rejects_fabricated_quote():
    result = validate_claim("esto nunca apareció en el documento", "un documento distinto por completo")
    assert result.ok is False
    assert result.span_start is None


def test_tolerates_whitespace_differences():
    result = validate_claim("texto  citado", "documento con texto\ncitado acá")
    assert result.ok is True


def test_tolerates_html_entities():
    result = validate_claim("Airflow & dbt", "el documento habla de Airflow &amp; dbt en detalle")
    assert result.ok is True


def test_rejects_empty_quote():
    result = validate_claim("", "cualquier documento")
    assert result.ok is False


def test_tolerates_html_tags_in_document():
    doc = 'the community announces version 0.8.0 of <a href="https://x.dev">iceberg-rust</a>. this release covers'
    result = validate_claim("version 0.8.0 of iceberg-rust.", doc)
    assert result.ok is True


def test_tolerates_tags_splitting_words_across_lines():
    doc = "<p>You can take advantage of\n<strong>Apache Superset</strong>, or automate with <em>Airflow</em>.</p>"
    result = validate_claim("take advantage of Apache Superset, or automate with Airflow.", doc)
    assert result.ok is True


def test_still_rejects_quote_that_only_exists_inside_a_tag():
    # El texto de un atributo no es contenido del artículo: una cita que solo
    # coincide con un href no puede anclar.
    doc = '<a href="https://x.dev/fake-claim-inventado">enlace</a>'
    result = validate_claim("fake-claim-inventado", doc)
    assert result.ok is False


def test_quote_with_angle_brackets_in_text_is_not_treated_as_a_tag():
    result = validate_claim("if a < b and c > d then", "la regla: if a < b and c > d then falla")
    assert result.ok is True


def test_block_tags_do_not_glue_paragraphs_together():
    result = validate_claim("first paragraph ends. second begins", "<p>first paragraph ends.</p><p>second begins</p>")
    assert result.ok is True


def test_rejects_quote_that_is_only_markup():
    # Normaliza a "" y "".find(...) da 0: sin el chequeo posterior a normalizar,
    # anclaría contra cualquier documento.
    for quote in ("<br>", "<a href='x'></a>", "<!-- nada -->"):
        assert validate_claim(quote, "un documento cualquiera").ok is False, quote
