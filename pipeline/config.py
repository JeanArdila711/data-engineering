"""Carga y validación del catálogo de herramientas.

El catálogo es dato, no código: este módulo es lo único que sabe leerlo,
y ningún otro módulo del pipeline conoce herramientas concretas.
"""

from collections import Counter
from pathlib import Path

import yaml
from pydantic import BaseModel, Field


class Tool(BaseModel):
    slug: str
    name: str
    category: str
    vendor: str | None = None
    repo: str | None = None
    homepage: str | None = None
    aliases: list[str] = Field(default_factory=list)


class Catalog(BaseModel):
    tools: list[Tool]


def load_catalog(path: Path) -> Catalog:
    """Lee el catálogo desde YAML y valida que los slugs sean únicos."""
    raw = yaml.safe_load(path.read_text())
    catalog = Catalog.model_validate(raw)

    duplicates = [slug for slug, count in Counter(t.slug for t in catalog.tools).items() if count > 1]
    if duplicates:
        raise ValueError(f"slugs duplicados en el catálogo: {', '.join(sorted(duplicates))}")

    return catalog
