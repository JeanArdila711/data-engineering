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
