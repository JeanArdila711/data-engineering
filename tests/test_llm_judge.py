"""judge_entailment: el veredicto se parsea de texto libre en español."""

import pytest

from pipeline.llm import GeminiClient


class _Response:
    def __init__(self, text):
        self.text = text


class _Models:
    def __init__(self, text):
        self._text = text

    def generate_content(self, model, contents, **kwargs):
        return _Response(self._text)


class _FakeGenai:
    def __init__(self, text):
        self.models = _Models(text)


def _judge(answer: str) -> bool:
    client = GeminiClient("k", "summary-model", "judge-model")
    client._client = _FakeGenai(answer)
    return client.judge_entailment("cita", "afirmación")


@pytest.mark.parametrize("answer", ["Sí.", "sí", "SÍ", "Sí, se sigue.", "Si", "si", "  Sí\n"])
def test_affirmative_answers_count_as_entailed(answer):
    # El 2026-09-30 el juez devolvía "Sí." y `startswith("si")` no lo reconocía:
    # 16 de 17 veredictos salían "no", el muestreo quedaba en 100% para siempre.
    assert _judge(answer) is True


@pytest.mark.parametrize("answer", ["No", "No.", "no, no se sigue", "  NO\n"])
def test_negative_answers_do_not_count_as_entailed(answer):
    assert _judge(answer) is False


def test_an_answer_that_merely_contains_si_later_is_not_entailed():
    assert _judge("No, aunque sí menciona el tema.") is False
