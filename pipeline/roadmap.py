"""Carga y validación del grafo de la ruta.

Mismo criterio que pipeline/config.py: el grafo es dato, no código, y este
módulo es lo único que sabe leerlo. La validación falla la corrida entera
antes de escribir nada — un grafo a medias enseña mal, y el error se ve en
vez de degradarse en silencio (decisión 8).
"""

from collections import Counter
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, Field, ValidationError

from pipeline.config import Catalog

Tipo = Literal["concepto", "herramienta", "capacidad-cloud"]
Proveedor = Literal["aws", "gcp", "azure", "portable"]
Equivalencia = Literal["alta", "media", "baja"]


class RoadmapError(ValueError):
    """El grafo no es válido. Nunca se escribe nada a la base con este error."""


class Experience(BaseModel):
    texto: str
    link: str | None = None


class Source(BaseModel):
    url: str
    por_que: str


class Implementation(BaseModel):
    nombre: str
    tool_slug: str | None = None
    proveedor: Proveedor | None = None
    equivalencia: Equivalencia | None = None
    nota: str | None = None


class RoadmapNode(BaseModel):
    slug: str
    tipo: Tipo
    nombre: str
    resuelve: str
    dominado_cuando: str
    nivel: int
    orden_sugerido: int = 0
    prerequisitos: list[str] = Field(default_factory=list)
    lo_vi_romperse: Experience | None = None
    fuentes: list[Source] = Field(default_factory=list)
    implementaciones: list[Implementation] = Field(default_factory=list)


class Roadmap(BaseModel):
    nodes: list[RoadmapNode]


def _detectar_ciclo(nodes: list[RoadmapNode]) -> list[str] | None:
    """DFS con marcas de color. Devuelve el ciclo encontrado, o None."""
    prereqs = {n.slug: n.prerequisitos for n in nodes}
    estado: dict[str, int] = {}  # 0 sin visitar, 1 en la pila, 2 terminado
    camino: list[str] = []

    def visitar(slug: str) -> list[str] | None:
        estado[slug] = 1
        camino.append(slug)
        for previo in prereqs.get(slug, []):
            if estado.get(previo, 0) == 1:
                return camino[camino.index(previo):] + [previo]
            if estado.get(previo, 0) == 0:
                ciclo = visitar(previo)
                if ciclo:
                    return ciclo
        camino.pop()
        estado[slug] = 2
        return None

    for node in nodes:
        if estado.get(node.slug, 0) == 0:
            ciclo = visitar(node.slug)
            if ciclo:
                return ciclo
    return None


def _validar(roadmap: Roadmap, catalog: Catalog) -> None:
    # Un YAML truncado o mal indentado puede parsear como lista vacía: sin este
    # chequeo, sync_roadmap borraría la tabla entera (su DELETE mantiene solo
    # los slugs presentes) sin una sola señal de que algo salió mal.
    if not roadmap.nodes:
        raise RoadmapError("el grafo no puede estar vacío")

    slugs = [n.slug for n in roadmap.nodes]

    duplicados = sorted(s for s, c in Counter(slugs).items() if c > 1)
    if duplicados:
        raise RoadmapError(f"slug duplicado en el grafo: {', '.join(duplicados)}")

    # sync_roadmap inserta las listas de un nodo en un bucle con autocommit=True:
    # un duplicado adentro de un nodo viola el UNIQUE a mitad de camino y deja
    # estado parcial escrito. Se rechaza acá para que la validación siga
    # significando "no se escribe nada".
    for node in roadmap.nodes:
        prereqs_dup = sorted(s for s, c in Counter(node.prerequisitos).items() if c > 1)
        if prereqs_dup:
            raise RoadmapError(
                f"'{node.slug}' repite el mismo prerequisito: {', '.join(prereqs_dup)}"
            )

        fuentes_dup = sorted(u for u, c in Counter(f.url for f in node.fuentes).items() if c > 1)
        if fuentes_dup:
            raise RoadmapError(
                f"'{node.slug}' repite la misma fuente: {', '.join(fuentes_dup)}"
            )

        implementaciones_dup = sorted(
            n for n, c in Counter(i.nombre for i in node.implementaciones).items() if c > 1
        )
        if implementaciones_dup:
            raise RoadmapError(
                f"'{node.slug}' repite la misma implementación: {', '.join(implementaciones_dup)}"
            )

    conocidos = set(slugs)
    for node in roadmap.nodes:
        faltantes = sorted(set(node.prerequisitos) - conocidos)
        if faltantes:
            raise RoadmapError(
                f"'{node.slug}' declara prerequisitos que no existen: {', '.join(faltantes)}"
            )

    ciclo = _detectar_ciclo(roadmap.nodes)
    if ciclo:
        raise RoadmapError(f"ciclo en los prerequisitos: {' -> '.join(ciclo)}")

    # El front agrupa por nivel, asi que un prerequisito de nivel superior se
    # renderizaria despues del nodo que lo necesita: el orden topologico y la
    # agrupacion visual dirian cosas distintas.
    niveles = {n.slug: n.nivel for n in roadmap.nodes}
    for node in roadmap.nodes:
        for previo in node.prerequisitos:
            if niveles[previo] > node.nivel:
                raise RoadmapError(
                    f"'{node.slug}' (nivel {node.nivel}) declara como prerequisito a "
                    f"'{previo}', que esta en nivel {niveles[previo]}"
                )

    herramientas = {t.slug for t in catalog.tools}
    for node in roadmap.nodes:
        for impl in node.implementaciones:
            if impl.tool_slug is not None and impl.tool_slug not in herramientas:
                raise RoadmapError(
                    f"'{node.slug}' referencia la herramienta '{impl.tool_slug}', "
                    "que no está en catalog/tools.yaml"
                )
            if impl.equivalencia is not None and node.tipo != "capacidad-cloud":
                raise RoadmapError(
                    f"'{node.slug}' declara equivalencia en un nodo que no es capacidad-cloud"
                )
            if impl.equivalencia in ("media", "baja") and not impl.nota:
                raise RoadmapError(
                    f"'{node.slug}' declara equivalencia '{impl.equivalencia}' para "
                    f"'{impl.nombre}' sin nota que explique la diferencia"
                )


def load_roadmap(path: Path, catalog: Catalog) -> Roadmap:
    """Lee el grafo desde YAML y lo valida. Levanta RoadmapError si algo falla."""
    raw = yaml.safe_load(path.read_text())
    try:
        roadmap = Roadmap.model_validate(raw)
    except ValidationError as exc:
        raise RoadmapError(f"grafo inválido: {exc}") from exc

    _validar(roadmap, catalog)
    return roadmap
