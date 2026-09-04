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

_TRANSLATE_PROMPT = """Traducí el siguiente texto al español. Mantené el sentido exacto, sin agregar ni quitar información.
No comentes la traducción, no expliques nada, no evalúes si el texto ya está en español — solo traducí.

Devolvé JSON: {{"translation": "texto traducido"}}

Texto:
{text}"""

_DISCOVERY_PROMPT = """Leé este artículo de ingeniería de datos. Identificá nombres de herramientas, \
frameworks o productos de datos mencionados que NO estén en esta lista conocida: {known}.

Ignorá nombres genéricos ("the platform", "our tool") y cualquier variante de los nombres conocidos \
(mayúsculas, alias, abreviaciones). Si no encontrás ninguno, devolvé una lista vacía.

Devolvé JSON: {{"candidates": ["nombre1", "nombre2"]}}

Artículo:
{document}"""

_BLURB_PROMPT = """Sos el autor de una ruta de aprendizaje de ingeniería de datos. Explicale a la persona, \
en segunda persona y en español rioplatense neutro (voseo), por qué esta ruta tiene este orden \
para este objetivo desde este punto de partida.

Objetivo: {objetivo} — {descripcion}
Punto de partida: {partida}
Ya sabe (no hace falta enseñárselo): {sabidos}

La ruta, en orden, con lo que resuelve cada paso:
{nodos}

Reglas:
- 3 o 4 oraciones, máximo 600 caracteres.
- Explicá el porqué del orden (qué desbloquea qué), no lo describas paso por paso.
- Nombrá como mucho 3 conceptos, y SOLO de la lista de arriba, escritos exactamente igual.
- No nombres herramientas, productos ni conceptos que no estén en la lista.
- Sin saludos, sin títulos, sin viñetas.

Devolvé JSON: {{"texto": "..."}}"""


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
        # Sin response_mime_type, el modelo a veces respondía con meta-comentario
        # sobre la traducción ("el texto ya está en español...") en vez de
        # traducir — forzar JSON elimina esa clase de respuesta estructuralmente,
        # igual que en draft_summary.
        response = self._client.models.generate_content(
            model=self._summary_model,
            contents=_TRANSLATE_PROMPT.format(text=text),
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        payload = json.loads(response.text)
        return payload["translation"].strip()

    def extract_candidates(self, document: str, known_names: list[str]) -> list[str]:
        response = self._client.models.generate_content(
            model=self._summary_model,
            contents=_DISCOVERY_PROMPT.format(known=", ".join(known_names), document=document),
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        payload = json.loads(response.text)
        return payload.get("candidates", [])

    def draft_route_blurb(
        self, objetivo: str, descripcion: str, partida: str,
        nodos: list[tuple[str, str]], sabidos: list[str],
    ) -> str:
        response = self._client.models.generate_content(
            model=self._summary_model,
            contents=_BLURB_PROMPT.format(
                objetivo=objetivo, descripcion=descripcion, partida=partida,
                sabidos=", ".join(sabidos) or "nada todavía",
                nodos="\n".join(f"- {nombre}: {resuelve}" for nombre, resuelve in nodos),
            ),
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        payload = json.loads(response.text)
        return str(payload["texto"]).strip()
