"""Cliente delgado sobre Gemini. Nunca se usa directo en tests — se inyecta.

El modelo es config, no código (mismo criterio que decisión 7 para el
catálogo): el nombre exacto vive en GEMINI_MODEL_SUMMARY / GEMINI_MODEL_JUDGE,
confirmados en Task 0 contra el pricing vigente al momento de implementar.
"""

import json
from dataclasses import dataclass, field

from google import genai
from google.genai import types


@dataclass(frozen=True)
class SummaryDraft:
    text: str
    quotes: list[str] = field(default_factory=list)


_SUMMARY_PROMPT = """Resumí este artículo en 2-3 líneas para un data engineer, mencionando: {tools}.
Devolvé JSON: {{"text": "resumen", "quotes": ["cita literal 1", "cita literal 2"]}}
Cada cita en "quotes" DEBE ser una copia exacta de un fragmento del documento — nunca la parafrasees.

Documento:
{document}"""


class GeminiClient:
    def __init__(self, api_key: str, summary_model: str, judge_model: str):
        self._client = genai.Client(api_key=api_key)
        self._summary_model = summary_model
        self._judge_model = judge_model

    def draft_summary(self, document: str, tool_names: list[str]) -> SummaryDraft:
        response = self._client.models.generate_content(
            model=self._summary_model,
            contents=_SUMMARY_PROMPT.format(tools=", ".join(tool_names), document=document),
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        # response_mime_type fuerza JSON sin markdown/prosa alrededor — el modelo
        # todavía puede devolver texto vacío (bloqueo de seguridad, corte por
        # longitud); json.loads("") ya levanta JSONDecodeError con contexto claro.
        payload = json.loads(response.text)
        return SummaryDraft(text=payload["text"], quotes=payload.get("quotes", []))

    def judge_entailment(self, claim_quote: str, summary_text: str) -> bool:
        prompt = (
            f'¿La siguiente afirmación se sigue lógicamente de esta cita? '
            f'Respondé solo "si" o "no".\n\nCita: {claim_quote}\nAfirmación: {summary_text}'
        )
        response = self._client.models.generate_content(model=self._judge_model, contents=prompt)
        return response.text.strip().lower().startswith("si")

    def translate(self, text: str) -> str:
        prompt = f"Traducí este resumen al español, manteniendo el sentido exacto, sin agregar información:\n\n{text}"
        response = self._client.models.generate_content(model=self._summary_model, contents=prompt)
        return response.text.strip()
