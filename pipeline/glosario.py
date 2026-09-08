"""Carga y validación del glosario granular.

Mismo criterio que pipeline/roadmap.py: el glosario es dato, no código. Este
módulo es lo único que sabe leerlo, y valida contra el grafo ya cargado
(nodos y niveles) para que un slug o un nivel inconsistente falle antes de
escribir nada (decisión 8 de DE Radar).
"""

from collections import Counter
from pathlib import Path

import yaml
from pydantic import BaseModel, Field, ValidationError, field_validator, model_validator

from pipeline.roadmap import _SLUG_URL, Roadmap


class GlosarioError(ValueError):
    """El glosario no es válido. Nunca se escribe nada a la base con este error."""


class GlossarySource(BaseModel):
    url: str
    por_que: str

    @field_validator("url", "por_que")
    @classmethod
    def _no_vacio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("no puede estar vacío")
        return v


class GlossaryTerm(BaseModel):
    slug: str
    termino: str
    definicion: str
    nivel: int
    nodo_relacionado: str | None = None
    fuentes: list[GlossarySource] = Field(min_length=1)
    uso_texto: str | None = None
    uso_link: str | None = None

    @field_validator("termino", "definicion")
    @classmethod
    def _no_vacio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("no puede estar vacío")
        return v

    @model_validator(mode="after")
    def _uso_link_requiere_texto(self) -> "GlossaryTerm":
        if self.uso_link and not self.uso_texto:
            raise ValueError(f"'{self.slug}': uso_link sin uso_texto")
        return self


class Glosario(BaseModel):
    terminos: list[GlossaryTerm] = Field(default_factory=list)


def _validar(glosario: Glosario, roadmap: Roadmap) -> None:
    node_slugs = {n.slug for n in roadmap.nodes}
    term_slugs = [t.slug for t in glosario.terminos]

    duplicados = sorted(s for s, c in Counter(term_slugs).items() if c > 1)
    if duplicados:
        raise GlosarioError(f"slug duplicado en el glosario: {', '.join(duplicados)}")

    colisiones = sorted(set(term_slugs) & node_slugs)
    if colisiones:
        raise GlosarioError(
            f"slug de término colisiona con un nodo del grafo: {', '.join(colisiones)}"
        )

    for term in glosario.terminos:
        if not _SLUG_URL.match(term.slug):
            raise GlosarioError(
                f"el slug '{term.slug}' no sirve como segmento de URL "
                "(solo minúsculas, dígitos y guiones)"
            )
        if roadmap.niveles and term.nivel not in roadmap.niveles:
            raise GlosarioError(f"'{term.slug}' usa el nivel {term.nivel}, que no está en niveles")
        if term.nodo_relacionado is not None and term.nodo_relacionado not in node_slugs:
            raise GlosarioError(
                f"'{term.slug}' referencia el nodo '{term.nodo_relacionado}', que no existe"
            )

    # Regla bidireccional (solo tiene sentido cuando el grafo declara niveles):
    # todo nivel declarado se usa por al menos un nodo o un término. Es la
    # regla que habría atrapado el bug del nivel 9 saltado en producción.
    if roadmap.niveles:
        usados = {n.nivel for n in roadmap.nodes} | {t.nivel for t in glosario.terminos}
        sin_usar = sorted(set(roadmap.niveles) - usados)
        if sin_usar:
            raise GlosarioError(f"niveles declarados sin ningún nodo ni término: {sin_usar}")


def load_glosario(path: Path, roadmap: Roadmap) -> Glosario:
    """Lee el glosario desde YAML y lo valida contra el grafo ya cargado.
    Levanta GlosarioError si algo falla."""
    raw = yaml.safe_load(path.read_text())
    try:
        glosario = Glosario.model_validate(raw)
    except ValidationError as exc:
        raise GlosarioError(f"glosario inválido: {exc}") from exc

    _validar(glosario, roadmap)
    return glosario
