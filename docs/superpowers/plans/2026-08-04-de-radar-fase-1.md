# DE Radar — Fase 1: Changelog del ecosistema

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar un changelog del ecosistema de Data Engineering que se actualiza solo, ingiriendo releases de GitHub para un catálogo curado de herramientas, sin intervención humana durante siete días.

**Architecture:** Un pipeline Python corre por cron en GitHub Actions, lee un catálogo de herramientas desde YAML versionado, ingiere releases de la API de GitHub, guarda el payload crudo antes de parsear, y carga a Postgres con idempotencia por clave natural. dbt transforma de `raw` a `marts`. Next.js lee los marts y renderiza con ISR, sin ingerir nada.

**Tech Stack:** Python 3.12 · uv · pydantic v2 · httpx · psycopg 3 · pytest · dbt-core + dbt-postgres · Postgres (Neon) · Next.js App Router + TypeScript · GitHub Actions

## Global Constraints

- **Fase 1 no usa LLM.** Ni clasificación, ni resúmenes, ni scoring. Todo el parsing es determinista. La capa de texto generado entra en Fase 2.
- **El catálogo es dato, no código.** Ninguna herramienta puede aparecer hardcodeada en un módulo Python. Agregar una herramienta es editar `catalog/tools.yaml`.
- **Idempotencia obligatoria.** Correr el pipeline N veces produce el mismo estado que correrlo una vez. Toda escritura es upsert por clave natural o overwrite por partición.
- **Nada se descarta en silencio.** Lo que falla validación va a `quarantine` con el error, la fuente y el payload crudo.
- **Logging con contexto.** Todo log de error incluye: fuente, parámetros, paso del pipeline y traceback completo. Prohibido `except: pass` y `except Exception` sin re-raise o clasificación.
- **Buen ciudadano:** user-agent identificable con URL de contacto, token de GitHub en todas las llamadas a la API, respetar `robots.txt`.
- **Zona horaria:** todo `ds` se calcula en UTC.
- **Definición de listo:** changelog publicado, cron corriendo siete días sin intervención manual, cero datos falsos y cero duplicados en ese periodo.

## File Structure

```
data-engineering/
├── pyproject.toml                    # deps y config de pytest
├── catalog/
│   └── tools.yaml                    # catálogo curado (dato, no código)
├── pipeline/
│   ├── __init__.py
│   ├── config.py                     # modelos pydantic + loader del catálogo
│   ├── versions.py                   # normalización de versiones a semver canónico
│   ├── changes.py                    # heurística de breaking changes
│   ├── fetch.py                      # cliente HTTP con retry y backoff
│   ├── sources/
│   │   ├── __init__.py
│   │   └── github.py                 # adaptador GitHub Releases → ReleaseRecord
│   ├── db.py                         # conexión, upserts, SCD2, cuarentena
│   └── run.py                        # entrypoint: orquesta el barrido del catálogo
├── migrations/
│   └── 001_initial.sql               # esquema completo de Fase 1
├── tests/
│   ├── conftest.py
│   ├── fixtures/                     # payloads reales guardados
│   ├── test_config.py
│   ├── test_versions.py
│   ├── test_changes.py
│   ├── test_fetch.py
│   ├── test_github.py
│   ├── test_db.py
│   └── test_run.py
├── transform/                        # proyecto dbt
│   ├── dbt_project.yml
│   ├── profiles.yml
│   └── models/
│       ├── staging/
│       │   ├── stg_tools.sql
│       │   ├── stg_releases.sql
│       │   └── schema.yml            # tests de calidad
│       └── marts/
│           ├── mart_changelog.sql
│           └── schema.yml
├── web/                              # Next.js
└── .github/workflows/ingest.yml      # cron diario
```

Cada módulo de `pipeline/` tiene una responsabilidad: `versions.py` y `changes.py` son funciones puras sin I/O (fáciles de testear exhaustivamente), `fetch.py` aísla la red, `sources/github.py` traduce un formato externo a nuestro modelo, `db.py` aísla la persistencia, y `run.py` es el único que sabe orquestar. El worker nunca sabe qué herramientas existen: las recibe de `config.py`.

---

## Task 0: Prerequisitos manuales

Esta tarea no tiene código ni tests — es setup que requiere credenciales y decisiones de cuenta. **Debe completarse antes de la Task 1.**

- [x] **Step 1: Verificar el free tier de Neon** — hecho

Confirmado contra el pricing público: FREE = $0, 100 proyectos, 100 CU-hrs/mes por proyecto, 0.5 GB storage/proyecto, tamaños hasta 2 CU (8 GB RAM), autosuspend activo. El diseño de `raw_fetches` (partición por content_hash) y la revalidación on-demand ya están ajustados a estos números — ver Task 8 y Task 12.

- [ ] **Step 2: Crear la base y guardar la connection string**

Crear un proyecto en Neon, una base `de_radar`, y guardar la connection string. No la pegues en ningún archivo del repo.

- [ ] **Step 3: Crear el token de GitHub**

Generar un fine-grained personal access token **sin permisos de escritura** — solo lectura pública, que es todo lo que necesita la API de releases. El límite anónimo de la API no alcanza para barrer 25 repos a diario.

- [ ] **Step 4: Cargar los secretos en GitHub Actions**

En el repo: Settings → Secrets and variables → Actions. Crear `DATABASE_URL` y `GH_API_TOKEN`.

- [ ] **Step 5: Crear `.env` local para desarrollo**

```bash
printf 'DATABASE_URL=<tu-connection-string>\nGH_API_TOKEN=<tu-token>\n' > .env
printf '.env\n.venv/\n__pycache__/\n*.pyc\ntarget/\ndbt_packages/\nnode_modules/\n.next/\n' > .gitignore
git add .gitignore && git commit -m "chore: add gitignore"
```

---

## Task 1: Scaffold y catálogo validado

**Files:**
- Create: `pyproject.toml`, `catalog/tools.yaml`, `pipeline/__init__.py`, `pipeline/config.py`
- Test: `tests/test_config.py`

**Interfaces:**
- Consumes: nada (primera tarea)
- Produces:
  - `Tool` — modelo pydantic: `slug: str`, `name: str`, `category: str`, `vendor: str | None`, `repo: str | None`, `homepage: str | None`, `aliases: list[str]`
  - `Catalog` — modelo pydantic: `tools: list[Tool]`
  - `load_catalog(path: Path) -> Catalog` — lanza `ValueError` si hay slugs duplicados

- [ ] **Step 1: Crear el proyecto Python**

```bash
cd /Users/jeanardila/Developer/Proyectos/personales/data-engineering
uv init --name de-radar --python 3.12
uv add pydantic httpx "psycopg[binary]" pyyaml python-dotenv
uv add --dev pytest pytest-cov
```

- [ ] **Step 2: Configurar pytest en `pyproject.toml`**

Agregar al final del archivo:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]
```

- [ ] **Step 3: Escribir el test que falla**

Crear `tests/test_config.py`:

```python
from pathlib import Path

import pytest

from pipeline.config import Catalog, Tool, load_catalog


def test_load_catalog_parses_tools(tmp_path: Path):
    catalog_file = tmp_path / "tools.yaml"
    catalog_file.write_text(
        "tools:\n"
        "  - slug: duckdb\n"
        "    name: DuckDB\n"
        "    category: query-engine\n"
        "    repo: duckdb/duckdb\n"
        "    aliases: [duck db]\n"
    )

    catalog = load_catalog(catalog_file)

    assert isinstance(catalog, Catalog)
    assert len(catalog.tools) == 1
    assert catalog.tools[0].slug == "duckdb"
    assert catalog.tools[0].aliases == ["duck db"]
    assert catalog.tools[0].vendor is None


def test_load_catalog_rejects_duplicate_slugs(tmp_path: Path):
    catalog_file = tmp_path / "tools.yaml"
    catalog_file.write_text(
        "tools:\n"
        "  - slug: duckdb\n"
        "    name: DuckDB\n"
        "    category: query-engine\n"
        "  - slug: duckdb\n"
        "    name: DuckDB Duplicado\n"
        "    category: query-engine\n"
    )

    with pytest.raises(ValueError, match="duckdb"):
        load_catalog(catalog_file)


def test_tool_requires_slug_name_and_category():
    with pytest.raises(Exception):
        Tool(slug="x")
```

- [ ] **Step 4: Correr el test y verificar que falla**

Run: `uv run pytest tests/test_config.py -v`
Expected: FAIL con `ModuleNotFoundError: No module named 'pipeline.config'`

- [ ] **Step 5: Implementar `pipeline/config.py`**

```python
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
```

Crear también `pipeline/__init__.py` vacío.

- [ ] **Step 6: Correr los tests y verificar que pasan**

Run: `uv run pytest tests/test_config.py -v`
Expected: PASS, 3 tests

- [ ] **Step 7: Escribir el catálogo inicial**

Crear `catalog/tools.yaml` con diez herramientas para arrancar. El diseño apunta a 20-30; se llenan una vez el pipeline funcione, porque cada `repo` hay que verificarlo a mano contra GitHub.

```yaml
tools:
  - slug: airflow
    name: Apache Airflow
    category: orchestration
    vendor: Apache Software Foundation
    repo: apache/airflow
    homepage: https://airflow.apache.org
    aliases: [apache airflow]

  - slug: dbt-core
    name: dbt Core
    category: transformation
    vendor: dbt Labs
    repo: dbt-labs/dbt-core
    homepage: https://www.getdbt.com
    aliases: [dbt, data build tool]

  - slug: duckdb
    name: DuckDB
    category: query-engine
    repo: duckdb/duckdb
    homepage: https://duckdb.org
    aliases: [duck db]

  - slug: spark
    name: Apache Spark
    category: processing
    vendor: Apache Software Foundation
    repo: apache/spark
    homepage: https://spark.apache.org
    aliases: [apache spark, pyspark]

  - slug: iceberg
    name: Apache Iceberg
    category: table-format
    vendor: Apache Software Foundation
    repo: apache/iceberg
    homepage: https://iceberg.apache.org
    aliases: [apache iceberg]

  - slug: polars
    name: Polars
    category: dataframe
    repo: pola-rs/polars
    homepage: https://pola.rs
    aliases: []

  - slug: dagster
    name: Dagster
    category: orchestration
    vendor: Dagster Labs
    repo: dagster-io/dagster
    homepage: https://dagster.io
    aliases: []

  - slug: kafka
    name: Apache Kafka
    category: streaming
    vendor: Apache Software Foundation
    repo: apache/kafka
    homepage: https://kafka.apache.org
    aliases: [apache kafka]

  - slug: flink
    name: Apache Flink
    category: streaming
    vendor: Apache Software Foundation
    repo: apache/flink
    homepage: https://flink.apache.org
    aliases: [apache flink]

  - slug: trino
    name: Trino
    category: query-engine
    repo: trinodb/trino
    homepage: https://trino.io
    aliases: [presto sql]
```

- [ ] **Step 8: Agregar un test que valide el catálogo real**

Agregar al final de `tests/test_config.py`:

```python
def test_real_catalog_is_valid():
    catalog = load_catalog(Path("catalog/tools.yaml"))
    assert len(catalog.tools) >= 10
    assert all(t.repo for t in catalog.tools), "toda herramienta de Fase 1 necesita repo"
```

- [ ] **Step 9: Correr todos los tests**

Run: `uv run pytest -v`
Expected: PASS, 4 tests

- [ ] **Step 10: Commit**

```bash
git add pyproject.toml uv.lock catalog/ pipeline/ tests/
git commit -m "feat: catálogo de herramientas validado desde YAML"
```

---

## Task 2: Normalización de versiones

**Files:**
- Create: `pipeline/versions.py`
- Test: `tests/test_versions.py`

**Interfaces:**
- Consumes: nada
- Produces: `normalize_version(raw: str) -> str | None` — devuelve `"MAJOR.MINOR.PATCH"` con sufijo de prerelease si existe, o `None` si no se puede parsear

Esta es la pieza que evita insertar el mismo release tres veces por escribirse `v3.1.0`, `3.1.0` y `3.1`.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `tests/test_versions.py`:

```python
import pytest

from pipeline.versions import normalize_version


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("v3.1.0", "3.1.0"),
        ("3.1.0", "3.1.0"),
        ("3.1", "3.1.0"),
        ("3", "3.0.0"),
        ("V2.10.4", "2.10.4"),
        ("release-1.2.3", "1.2.3"),
        ("  1.2.3  ", "1.2.3"),
        ("1.2.3-rc1", "1.2.3-rc1"),
        ("v1.2.3-beta.2", "1.2.3-beta.2"),
        ("airflow-2.9.1", "2.9.1"),
    ],
)
def test_normalize_version_canonicalizes(raw: str, expected: str):
    assert normalize_version(raw) == expected


@pytest.mark.parametrize("raw", ["", "   ", "nightly", "latest", "sin-numeros"])
def test_normalize_version_returns_none_when_unparseable(raw: str):
    assert normalize_version(raw) is None


def test_normalize_version_collapses_equivalent_forms():
    assert normalize_version("v3.1") == normalize_version("3.1.0")
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `uv run pytest tests/test_versions.py -v`
Expected: FAIL con `ModuleNotFoundError`

- [ ] **Step 3: Implementar `pipeline/versions.py`**

```python
"""Normalización de versiones a semver canónico.

Las fuentes escriben la misma versión de muchas formas. Sin esta
normalización, la clave natural (herramienta, versión) no deduplica nada.
"""

import re

_VERSION_RE = re.compile(
    r"(?P<major>\d+)"
    r"(?:\.(?P<minor>\d+))?"
    r"(?:\.(?P<patch>\d+))?"
    r"(?:[-+](?P<pre>[0-9A-Za-z][0-9A-Za-z.-]*))?"
)


def normalize_version(raw: str) -> str | None:
    """Devuelve la versión como MAJOR.MINOR.PATCH[-PRERELEASE], o None."""
    if not raw or not raw.strip():
        return None

    match = _VERSION_RE.search(raw.strip())
    if not match:
        return None

    major = match.group("major")
    minor = match.group("minor") or "0"
    patch = match.group("patch") or "0"
    pre = match.group("pre")

    version = f"{major}.{minor}.{patch}"
    return f"{version}-{pre}" if pre else version
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `uv run pytest tests/test_versions.py -v`
Expected: PASS, 16 tests

- [ ] **Step 5: Commit**

```bash
git add pipeline/versions.py tests/test_versions.py
git commit -m "feat: normalización de versiones a semver canónico"
```

---

## Task 3: Heurística de breaking changes

**Files:**
- Create: `pipeline/changes.py`
- Test: `tests/test_changes.py`

**Interfaces:**
- Consumes: nada
- Produces:
  - `ChangeKind` — `Literal["breaking", "feature", "fix", "deprecation"]`
  - `ExtractedChange` — dataclass: `kind: ChangeKind`, `text: str`
  - `extract_changes(body: str) -> list[ExtractedChange]`
  - `has_breaking_changes(body: str) -> bool`

Fase 1 no usa LLM: si la heurística no encuentra nada, devuelve lista vacía y el release queda sin cambios clasificados. Eso es correcto, no un fallo.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `tests/test_changes.py`:

```python
from pipeline.changes import ExtractedChange, extract_changes, has_breaking_changes

BODY_WITH_SECTIONS = """
## What's Changed

### Breaking Changes
* Removed deprecated `run_as_user` parameter
* Minimum Python version is now 3.10

### Features
* Added support for dynamic task mapping

### Bug Fixes
* Fixed a race condition in the scheduler
"""


def test_extract_changes_reads_breaking_section():
    changes = extract_changes(BODY_WITH_SECTIONS)
    breaking = [c for c in changes if c.kind == "breaking"]

    assert len(breaking) == 2
    assert "run_as_user" in breaking[0].text


def test_extract_changes_reads_all_sections():
    changes = extract_changes(BODY_WITH_SECTIONS)
    kinds = {c.kind for c in changes}

    assert kinds == {"breaking", "feature", "fix"}


def test_extract_changes_preserves_original_text():
    changes = extract_changes(BODY_WITH_SECTIONS)
    assert any(c.text == "Minimum Python version is now 3.10" for c in changes)


def test_extract_changes_returns_empty_when_no_known_sections():
    assert extract_changes("Just a plain release note with no structure.") == []


def test_extract_changes_handles_empty_body():
    assert extract_changes("") == []


def test_has_breaking_changes_true_when_section_present():
    assert has_breaking_changes(BODY_WITH_SECTIONS) is True


def test_has_breaking_changes_false_without_section():
    assert has_breaking_changes("### Features\n* Something new") is False


def test_has_breaking_changes_detects_bang_convention():
    assert has_breaking_changes("feat!: drop support for Python 3.8") is True


def test_extract_changes_ignores_case_in_headers():
    body = "## BREAKING CHANGES\n* Removed the old API"
    changes = extract_changes(body)
    assert changes == [ExtractedChange(kind="breaking", text="Removed the old API")]
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `uv run pytest tests/test_changes.py -v`
Expected: FAIL con `ModuleNotFoundError`

- [ ] **Step 3: Implementar `pipeline/changes.py`**

```python
"""Extracción heurística de cambios desde el cuerpo de un release.

Fase 1 no usa LLM. Los proyectos serios marcan sus breaking changes con
secciones explícitas; cuando no lo hacen, devolvemos vacío en vez de
adivinar. Un falso negativo es preferible a inventar un breaking change.
"""

import re
from dataclasses import dataclass
from typing import Literal

ChangeKind = Literal["breaking", "feature", "fix", "deprecation"]

_SECTION_KINDS: dict[ChangeKind, tuple[str, ...]] = {
    "breaking": ("breaking change", "breaking changes", "breaking"),
    "deprecation": ("deprecation", "deprecations", "deprecated"),
    "feature": ("feature", "features", "new features", "what's new", "added"),
    "fix": ("bug fix", "bug fixes", "fixes", "fixed"),
}

_HEADER_RE = re.compile(r"^#{1,6}\s*(?P<title>.+?)\s*$", re.MULTILINE)
_BULLET_RE = re.compile(r"^\s*[-*+]\s+(?P<text>.+?)\s*$")
_BANG_RE = re.compile(r"^\s*\w+(\([^)]*\))?!:", re.MULTILINE)


@dataclass(frozen=True)
class ExtractedChange:
    kind: ChangeKind
    text: str


def _kind_for_header(title: str) -> ChangeKind | None:
    normalized = title.strip().lower().rstrip(":")
    for kind, labels in _SECTION_KINDS.items():
        if normalized in labels:
            return kind
    return None


def _clean_bullet(text: str) -> str:
    """Quita markdown inline básico sin alterar el contenido."""
    return text.replace("`", "").strip()


def extract_changes(body: str) -> list[ExtractedChange]:
    """Recorre las secciones del cuerpo y clasifica los bullets de cada una."""
    if not body or not body.strip():
        return []

    headers = list(_HEADER_RE.finditer(body))
    changes: list[ExtractedChange] = []

    for index, header in enumerate(headers):
        kind = _kind_for_header(header.group("title"))
        if kind is None:
            continue

        start = header.end()
        end = headers[index + 1].start() if index + 1 < len(headers) else len(body)

        for line in body[start:end].splitlines():
            bullet = _BULLET_RE.match(line)
            if bullet:
                changes.append(ExtractedChange(kind=kind, text=_clean_bullet(bullet.group("text"))))

    return changes


def has_breaking_changes(body: str) -> bool:
    """True si hay sección de breaking changes o convención `tipo!:`."""
    if not body:
        return False
    if any(c.kind == "breaking" for c in extract_changes(body)):
        return True
    return bool(_BANG_RE.search(body))
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `uv run pytest tests/test_changes.py -v`
Expected: PASS, 9 tests

- [ ] **Step 5: Commit**

```bash
git add pipeline/changes.py tests/test_changes.py
git commit -m "feat: extracción heurística de breaking changes"
```

---

## Task 4: Cliente HTTP con retry y backoff

**Files:**
- Create: `pipeline/fetch.py`
- Test: `tests/test_fetch.py`

**Interfaces:**
- Consumes: nada
- Produces:
  - `TransientError(Exception)` — fallo reintentable (timeout, 5xx, 429)
  - `PermanentError(Exception)` — fallo no reintentable (404, 401, 403 sin rate limit)
  - `FetchResult` — dataclass: `body: str`, `status: int`, `url: str`
  - `fetch(url: str, *, headers: dict[str, str] | None = None, max_attempts: int = 3, sleep: Callable[[float], None] = time.sleep, transport: httpx.BaseTransport | None = None) -> FetchResult`

Los parámetros `sleep` y `transport` se inyectan para que los tests no esperen de verdad ni toquen la red.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `tests/test_fetch.py`:

```python
import httpx
import pytest

from pipeline.fetch import FetchResult, PermanentError, TransientError, fetch


def _transport(*responses: httpx.Response) -> httpx.MockTransport:
    queue = list(responses)

    def handler(request: httpx.Request) -> httpx.Response:
        return queue.pop(0)

    return httpx.MockTransport(handler)


def test_fetch_returns_body_on_success():
    transport = _transport(httpx.Response(200, text="ok"))

    result = fetch("https://example.com/feed", transport=transport)

    assert isinstance(result, FetchResult)
    assert result.body == "ok"
    assert result.status == 200


def test_fetch_retries_on_5xx_then_succeeds():
    transport = _transport(
        httpx.Response(503),
        httpx.Response(200, text="recovered"),
    )
    slept: list[float] = []

    result = fetch("https://example.com/feed", transport=transport, sleep=slept.append)

    assert result.body == "recovered"
    assert len(slept) == 1


def test_fetch_backoff_is_exponential():
    transport = _transport(
        httpx.Response(503),
        httpx.Response(503),
        httpx.Response(200, text="ok"),
    )
    slept: list[float] = []

    fetch("https://example.com/feed", transport=transport, sleep=slept.append)

    assert slept[1] > slept[0]


def test_fetch_raises_transient_after_max_attempts():
    transport = _transport(httpx.Response(503), httpx.Response(503), httpx.Response(503))

    with pytest.raises(TransientError):
        fetch("https://example.com/feed", transport=transport, max_attempts=3, sleep=lambda _: None)


def test_fetch_raises_permanent_on_404_without_retrying():
    calls: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(404)

    with pytest.raises(PermanentError):
        fetch("https://example.com/missing", transport=httpx.MockTransport(handler), sleep=lambda _: None)

    assert len(calls) == 1


def test_fetch_treats_429_as_transient():
    transport = _transport(httpx.Response(429), httpx.Response(200, text="ok"))

    result = fetch("https://example.com/feed", transport=transport, sleep=lambda _: None)

    assert result.body == "ok"


def test_fetch_sends_identifiable_user_agent():
    seen: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request.headers["user-agent"])
        return httpx.Response(200, text="ok")

    fetch("https://example.com/feed", transport=httpx.MockTransport(handler))

    assert "de-radar" in seen[0].lower()
    assert "http" in seen[0].lower()
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `uv run pytest tests/test_fetch.py -v`
Expected: FAIL con `ModuleNotFoundError`

- [ ] **Step 3: Implementar `pipeline/fetch.py`**

```python
"""Cliente HTTP con clasificación explícita de errores.

Distinguir transitorio de permanente es lo que permite reintentar lo que
tiene sentido reintentar y marcar como rota la fuente que de verdad lo está.
"""

import time
from collections.abc import Callable
from dataclasses import dataclass

import httpx

USER_AGENT = "de-radar/0.1 (+https://github.com/jeanardila/de-radar)"

_RETRYABLE_STATUS = {429, 500, 502, 503, 504}
_BASE_BACKOFF_SECONDS = 1.0


class TransientError(Exception):
    """Fallo reintentable: timeout, 5xx, rate limit."""


class PermanentError(Exception):
    """Fallo no reintentable: 404, 401, 403."""


@dataclass(frozen=True)
class FetchResult:
    body: str
    status: int
    url: str


def fetch(
    url: str,
    *,
    headers: dict[str, str] | None = None,
    max_attempts: int = 3,
    sleep: Callable[[float], None] = time.sleep,
    transport: httpx.BaseTransport | None = None,
) -> FetchResult:
    """Trae una URL con reintentos y backoff exponencial."""
    request_headers = {"User-Agent": USER_AGENT, **(headers or {})}
    last_error: Exception | None = None

    with httpx.Client(transport=transport, timeout=30.0, follow_redirects=True) as client:
        for attempt in range(max_attempts):
            try:
                response = client.get(url, headers=request_headers)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_error = exc
            else:
                if response.status_code < 400:
                    return FetchResult(body=response.text, status=response.status_code, url=url)
                if response.status_code not in _RETRYABLE_STATUS:
                    raise PermanentError(f"{url} devolvió {response.status_code}")
                last_error = TransientError(f"{url} devolvió {response.status_code}")

            if attempt < max_attempts - 1:
                sleep(_BASE_BACKOFF_SECONDS * (2**attempt))

    raise TransientError(f"{url} falló tras {max_attempts} intentos: {last_error}")
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `uv run pytest tests/test_fetch.py -v`
Expected: PASS, 7 tests

- [ ] **Step 5: Commit**

```bash
git add pipeline/fetch.py tests/test_fetch.py
git commit -m "feat: cliente HTTP con retry, backoff y errores clasificados"
```

---

## Task 5: Adaptador de GitHub Releases

**Files:**
- Create: `pipeline/sources/__init__.py`, `pipeline/sources/github.py`, `tests/fixtures/github_releases_duckdb.json`
- Test: `tests/test_github.py`

**Interfaces:**
- Consumes: `normalize_version` (Task 2), `extract_changes` / `has_breaking_changes` (Task 3), `fetch` / `FetchResult` (Task 4), `Tool` (Task 1)
- Produces:
  - `ReleaseRecord` — dataclass: `tool_slug: str`, `version: str`, `published_at: datetime`, `source_url: str`, `body: str`, `has_breaking: bool`, `changes: list[ExtractedChange]`
  - `parse_releases(tool: Tool, payload: str) -> list[ReleaseRecord]` — descarta drafts y versiones no parseables
  - `fetch_releases(tool: Tool, token: str, **kwargs) -> tuple[str, list[ReleaseRecord]]` — devuelve `(payload_crudo, registros)`

`fetch_releases` devuelve el payload crudo junto a los registros porque la Task 7 lo guarda antes de parsear.

- [ ] **Step 1: Crear el fixture**

```bash
mkdir -p tests/fixtures
curl -s "https://api.github.com/repos/duckdb/duckdb/releases?per_page=5" \
  -H "Accept: application/vnd.github+json" \
  > tests/fixtures/github_releases_duckdb.json
```

Verificar que el archivo tenga contenido real y no un mensaje de rate limit:

```bash
head -c 200 tests/fixtures/github_releases_duckdb.json
```

Si aparece `"message": "API rate limit exceeded"`, repetir agregando `-H "Authorization: Bearer $GH_API_TOKEN"`.

- [ ] **Step 2: Escribir los tests que fallan**

Crear `tests/test_github.py`:

```python
import json
from datetime import datetime, timezone
from pathlib import Path

from pipeline.config import Tool
from pipeline.sources.github import ReleaseRecord, parse_releases

FIXTURE = Path("tests/fixtures/github_releases_duckdb.json")
TOOL = Tool(slug="duckdb", name="DuckDB", category="query-engine", repo="duckdb/duckdb")


def test_parse_releases_returns_records():
    records = parse_releases(TOOL, FIXTURE.read_text())

    assert records
    assert all(isinstance(r, ReleaseRecord) for r in records)
    assert all(r.tool_slug == "duckdb" for r in records)


def test_parse_releases_normalizes_versions():
    records = parse_releases(TOOL, FIXTURE.read_text())
    for record in records:
        assert not record.version.startswith("v")
        assert record.version.count(".") >= 2


def test_parse_releases_parses_published_at_as_utc():
    records = parse_releases(TOOL, FIXTURE.read_text())
    assert all(r.published_at.tzinfo == timezone.utc for r in records)


def test_parse_releases_skips_drafts():
    payload = json.dumps(
        [
            {
                "tag_name": "v1.0.0",
                "draft": True,
                "published_at": "2026-01-01T00:00:00Z",
                "html_url": "https://example.com/1",
                "body": "",
            },
            {
                "tag_name": "v0.9.0",
                "draft": False,
                "published_at": "2025-12-01T00:00:00Z",
                "html_url": "https://example.com/2",
                "body": "",
            },
        ]
    )

    records = parse_releases(TOOL, payload)

    assert [r.version for r in records] == ["0.9.0"]


def test_parse_releases_skips_unparseable_versions():
    payload = json.dumps(
        [
            {
                "tag_name": "nightly",
                "draft": False,
                "published_at": "2026-01-01T00:00:00Z",
                "html_url": "https://example.com/1",
                "body": "",
            }
        ]
    )

    assert parse_releases(TOOL, payload) == []


def test_parse_releases_skips_entries_without_published_at():
    payload = json.dumps(
        [
            {
                "tag_name": "v1.0.0",
                "draft": False,
                "published_at": None,
                "html_url": "https://example.com/1",
                "body": "",
            }
        ]
    )

    assert parse_releases(TOOL, payload) == []


def test_parse_releases_detects_breaking_changes():
    payload = json.dumps(
        [
            {
                "tag_name": "v2.0.0",
                "draft": False,
                "published_at": "2026-01-01T00:00:00Z",
                "html_url": "https://example.com/1",
                "body": "### Breaking Changes\n* Removed the legacy API",
            }
        ]
    )

    record = parse_releases(TOOL, payload)[0]

    assert record.has_breaking is True
    assert record.changes[0].text == "Removed the legacy API"


def test_parse_releases_keeps_original_body():
    payload = json.dumps(
        [
            {
                "tag_name": "v1.0.0",
                "draft": False,
                "published_at": "2026-01-01T00:00:00Z",
                "html_url": "https://example.com/1",
                "body": "texto original exacto",
            }
        ]
    )

    assert parse_releases(TOOL, payload)[0].body == "texto original exacto"
```

- [ ] **Step 3: Correr y verificar que falla**

Run: `uv run pytest tests/test_github.py -v`
Expected: FAIL con `ModuleNotFoundError`

- [ ] **Step 4: Implementar `pipeline/sources/github.py`**

```python
"""Adaptador de la API de GitHub Releases al modelo interno.

Traduce un formato externo a ReleaseRecord y no hace nada más: no persiste,
no decide qué herramientas existen, no orquesta.
"""

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone

from pipeline.changes import ExtractedChange, extract_changes, has_breaking_changes
from pipeline.config import Tool
from pipeline.fetch import fetch
from pipeline.versions import normalize_version

API_TEMPLATE = "https://api.github.com/repos/{repo}/releases?per_page=30"


@dataclass(frozen=True)
class ReleaseRecord:
    tool_slug: str
    version: str
    published_at: datetime
    source_url: str
    body: str
    has_breaking: bool
    changes: list[ExtractedChange] = field(default_factory=list)


def _parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def parse_releases(tool: Tool, payload: str) -> list[ReleaseRecord]:
    """Convierte el JSON de la API en registros válidos, descartando lo que no lo es."""
    entries = json.loads(payload)
    records: list[ReleaseRecord] = []

    for entry in entries:
        if entry.get("draft"):
            continue

        version = normalize_version(entry.get("tag_name") or "")
        published_at = _parse_timestamp(entry.get("published_at"))
        if version is None or published_at is None:
            continue

        body = entry.get("body") or ""
        records.append(
            ReleaseRecord(
                tool_slug=tool.slug,
                version=version,
                published_at=published_at,
                source_url=entry.get("html_url") or "",
                body=body,
                has_breaking=has_breaking_changes(body),
                changes=extract_changes(body),
            )
        )

    return records


def fetch_releases(tool: Tool, token: str, **kwargs) -> tuple[str, list[ReleaseRecord]]:
    """Trae los releases de una herramienta y devuelve el payload crudo junto a los registros."""
    if not tool.repo:
        raise ValueError(f"{tool.slug} no tiene repo configurado")

    result = fetch(
        API_TEMPLATE.format(repo=tool.repo),
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        **kwargs,
    )

    return result.body, parse_releases(tool, result.body)
```

Crear `pipeline/sources/__init__.py` vacío.

- [ ] **Step 5: Correr y verificar que pasan**

Run: `uv run pytest tests/test_github.py -v`
Expected: PASS, 8 tests

- [ ] **Step 6: Commit**

```bash
git add pipeline/sources/ tests/test_github.py tests/fixtures/
git commit -m "feat: adaptador de GitHub Releases con fixtures reales"
```

---

## Task 6: Esquema de base de datos

**Files:**
- Create: `migrations/001_initial.sql`, `pipeline/db.py` (solo conexión y migración)
- Test: `tests/test_db.py`, `tests/conftest.py`

**Interfaces:**
- Consumes: nada
- Produces:
  - `connect(dsn: str) -> psycopg.Connection`
  - `apply_migrations(conn, directory: Path = Path("migrations")) -> None` — idempotente

El esquema incluye SCD Tipo 2 desde el arranque aunque el mapa del ecosistema sea Fase 3: migrar a Tipo 2 después implicaría perder el historial acumulado hasta entonces.

- [ ] **Step 1: Levantar Postgres local para tests**

```bash
docker run -d --name de-radar-pg -e POSTGRES_PASSWORD=postgres -p 5433:5432 postgres:16
```

Agregar a `.env`:

```
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/postgres
```

- [ ] **Step 2: Escribir `tests/conftest.py`**

```python
import os
from pathlib import Path

import psycopg
import pytest
from dotenv import load_dotenv

load_dotenv()


@pytest.fixture
def db_conn():
    dsn = os.environ.get("TEST_DATABASE_URL")
    if not dsn:
        pytest.skip("TEST_DATABASE_URL no configurada")

    conn = psycopg.connect(dsn, autocommit=True)
    with conn.cursor() as cur:
        cur.execute("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;")

    from pipeline.db import apply_migrations

    apply_migrations(conn, Path("migrations"))
    yield conn
    conn.close()
```

- [ ] **Step 3: Escribir los tests que fallan**

Crear `tests/test_db.py`:

```python
from pathlib import Path

from pipeline.db import apply_migrations


def _tables(conn) -> set[str]:
    with conn.cursor() as cur:
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        return {row[0] for row in cur.fetchall()}


def test_migrations_create_expected_tables(db_conn):
    assert {
        "dim_tool",
        "sources",
        "raw_fetches",
        "fct_release",
        "release_changes",
        "quarantine",
        "schema_migrations",
    } <= _tables(db_conn)


def test_migrations_are_idempotent(db_conn):
    apply_migrations(db_conn, Path("migrations"))
    apply_migrations(db_conn, Path("migrations"))

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM schema_migrations")
        assert cur.fetchone()[0] == 1


def test_release_has_unique_constraint_on_natural_key(db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT count(*) FROM pg_indexes
            WHERE tablename = 'fct_release' AND indexdef LIKE '%UNIQUE%'
              AND indexdef LIKE '%tool_slug%' AND indexdef LIKE '%version%'
            """
        )
        assert cur.fetchone()[0] >= 1


def test_dim_tool_has_scd2_columns(db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'dim_tool'"
        )
        columns = {row[0] for row in cur.fetchall()}

    assert {"tool_key", "slug", "effective_from", "effective_to", "is_current"} <= columns
```

- [ ] **Step 4: Correr y verificar que falla**

Run: `uv run pytest tests/test_db.py -v`
Expected: FAIL con `ModuleNotFoundError`

- [ ] **Step 5: Escribir `migrations/001_initial.sql`**

```sql
CREATE TABLE IF NOT EXISTS dim_tool (
    tool_key        BIGGERIAL PRIMARY KEY,
    slug            TEXT        NOT NULL,
    name            TEXT        NOT NULL,
    category        TEXT        NOT NULL,
    vendor          TEXT,
    repo            TEXT,
    homepage        TEXT,
    effective_from  TIMESTAMPTZ NOT NULL,
    effective_to    TIMESTAMPTZ,
    is_current      BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS dim_tool_current_slug_idx
    ON dim_tool (slug) WHERE is_current;

CREATE TABLE IF NOT EXISTS sources (
    id                   BIGSERIAL PRIMARY KEY,
    tool_slug            TEXT        NOT NULL,
    kind                 TEXT        NOT NULL,
    url                  TEXT        NOT NULL,
    last_success_at      TIMESTAMPTZ,
    consecutive_failures INTEGER     NOT NULL DEFAULT 0,
    is_degraded          BOOLEAN     NOT NULL DEFAULT FALSE,
    UNIQUE (tool_slug, kind)
);

-- Particionada por content_hash, no por fecha: el free tier de Neon da 0.5 GB
-- y una fila diaria por herramienta lo llena en meses. La mayoría de los días
-- el payload es idéntico al anterior, así que solo guardamos versiones distintas.
--
-- Corolario descubierto corriendo el pipeline real contra Neon (Task 0/9): el
-- content_hash se calcula sobre el payload que llega a save_raw_fetch, no sobre
-- la respuesta cruda de la fuente. pipeline/sources/github.py normaliza el JSON
-- de GitHub antes de pasarlo (quita assets/reactions, campos que cambian con
-- cada descarga o reacción real sin releases nuevos) — si no, esta partición
-- no ahorra nada: cada corrida genera un hash distinto para cualquier
-- herramienta con actividad. Cualquier fuente nueva (RSS, etc.) necesita el
-- mismo cuidado antes de guardar su raw.
CREATE TABLE IF NOT EXISTS raw_fetches (
    id            BIGSERIAL PRIMARY KEY,
    source_id     BIGINT      NOT NULL REFERENCES sources(id),
    content_hash  TEXT        NOT NULL,
    first_seen_ds DATE        NOT NULL,
    last_seen_ds  DATE        NOT NULL,
    fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    payload       TEXT        NOT NULL,
    UNIQUE (source_id, content_hash)
);

CREATE TABLE IF NOT EXISTS fct_release (
    id           BIGSERIAL PRIMARY KEY,
    tool_slug    TEXT        NOT NULL,
    version      TEXT        NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    source_url   TEXT        NOT NULL,
    has_breaking BOOLEAN     NOT NULL DEFAULT FALSE,
    body         TEXT        NOT NULL,
    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tool_slug, version)
);

CREATE TABLE IF NOT EXISTS release_changes (
    id         BIGSERIAL PRIMARY KEY,
    release_id BIGINT NOT NULL REFERENCES fct_release(id) ON DELETE CASCADE,
    kind       TEXT   NOT NULL,
    text       TEXT   NOT NULL,
    UNIQUE (release_id, kind, text)
);

CREATE TABLE IF NOT EXISTS quarantine (
    id          BIGSERIAL PRIMARY KEY,
    source_ref  TEXT        NOT NULL,
    stage       TEXT        NOT NULL,
    error       TEXT        NOT NULL,
    payload     TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fct_release_published_idx ON fct_release (published_at DESC);
```

> **Nota para quien implementa:** hay un typo deliberado a corregir en el paso siguiente — `BIGGERIAL` no existe. El tipo correcto es `BIGSERIAL`. Si el test falla con `type "biggerial" does not exist`, esa es la causa.

- [ ] **Step 6: Corregir el typo**

Reemplazar `BIGGERIAL` por `BIGSERIAL` en la primera línea de `dim_tool`.

- [ ] **Step 7: Implementar la parte de conexión y migración en `pipeline/db.py`**

```python
"""Acceso a Postgres: conexión, migraciones y escrituras idempotentes."""

from pathlib import Path

import psycopg

_MIGRATIONS_TABLE = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""


def connect(dsn: str) -> psycopg.Connection:
    return psycopg.connect(dsn, autocommit=True)


def apply_migrations(conn: psycopg.Connection, directory: Path = Path("migrations")) -> None:
    """Aplica las migraciones pendientes. Correrlo dos veces no cambia nada."""
    with conn.cursor() as cur:
        cur.execute(_MIGRATIONS_TABLE)
        cur.execute("SELECT filename FROM schema_migrations")
        applied = {row[0] for row in cur.fetchall()}

    for path in sorted(directory.glob("*.sql")):
        if path.name in applied:
            continue
        with conn.cursor() as cur:
            cur.execute(path.read_text())
            cur.execute("INSERT INTO schema_migrations (filename) VALUES (%s)", (path.name,))
```

- [ ] **Step 8: Correr y verificar que pasan**

Run: `uv run pytest tests/test_db.py -v`
Expected: PASS, 4 tests

- [ ] **Step 9: Commit**

```bash
git add migrations/ pipeline/db.py tests/test_db.py tests/conftest.py
git commit -m "feat: esquema inicial con SCD tipo 2 y migraciones idempotentes"
```

---

## Task 7: Sincronización del catálogo con SCD Tipo 2

**Files:**
- Modify: `pipeline/db.py`
- Test: `tests/test_db.py`

**Interfaces:**
- Consumes: `Catalog`, `Tool` (Task 1), `connect` (Task 6)
- Produces:
  - `sync_catalog(conn, catalog: Catalog, now: datetime) -> None` — inserta herramientas nuevas, cierra y reabre filas cuando cambia un atributo, no toca nada si nada cambió
  - `sync_sources(conn, catalog: Catalog) -> dict[str, int]` — devuelve `{tool_slug: source_id}`

- [ ] **Step 1: Escribir los tests que fallan**

Agregar a `tests/test_db.py`:

```python
from datetime import datetime, timezone

from pipeline.config import Catalog, Tool
from pipeline.db import sync_catalog, sync_sources

T0 = datetime(2026, 1, 1, tzinfo=timezone.utc)
T1 = datetime(2026, 2, 1, tzinfo=timezone.utc)


def _catalog(category: str = "query-engine") -> Catalog:
    return Catalog(tools=[Tool(slug="duckdb", name="DuckDB", category=category, repo="duckdb/duckdb")])


def _rows(conn):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT slug, category, effective_from, effective_to, is_current "
            "FROM dim_tool ORDER BY effective_from"
        )
        return cur.fetchall()


def test_sync_catalog_inserts_new_tool(db_conn):
    sync_catalog(db_conn, _catalog(), T0)

    rows = _rows(db_conn)
    assert len(rows) == 1
    assert rows[0][0] == "duckdb"
    assert rows[0][3] is None
    assert rows[0][4] is True


def test_sync_catalog_is_idempotent_when_nothing_changes(db_conn):
    sync_catalog(db_conn, _catalog(), T0)
    sync_catalog(db_conn, _catalog(), T1)

    assert len(_rows(db_conn)) == 1


def test_sync_catalog_closes_old_row_when_attribute_changes(db_conn):
    sync_catalog(db_conn, _catalog("query-engine"), T0)
    sync_catalog(db_conn, _catalog("olap-database"), T1)

    rows = _rows(db_conn)
    assert len(rows) == 2

    old, new = rows
    assert old[1] == "query-engine"
    assert old[3] == T1
    assert old[4] is False
    assert new[1] == "olap-database"
    assert new[4] is True


def test_sync_sources_returns_ids_and_is_idempotent(db_conn):
    first = sync_sources(db_conn, _catalog())
    second = sync_sources(db_conn, _catalog())

    assert first == second
    assert "duckdb" in first
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `uv run pytest tests/test_db.py -v`
Expected: FAIL con `ImportError: cannot import name 'sync_catalog'`

- [ ] **Step 3: Implementar en `pipeline/db.py`**

Agregar al final del archivo:

```python
from datetime import datetime

from pipeline.config import Catalog

_TRACKED_ATTRIBUTES = ("name", "category", "vendor", "repo", "homepage")


def sync_catalog(conn: psycopg.Connection, catalog: Catalog, now: datetime) -> None:
    """Sincroniza el catálogo a dim_tool como SCD Tipo 2.

    Una fila nueva solo se crea cuando cambia un atributo rastreado; correrlo
    con el catálogo sin cambios no altera la tabla.
    """
    with conn.cursor() as cur:
        for tool in catalog.tools:
            cur.execute(
                "SELECT name, category, vendor, repo, homepage FROM dim_tool "
                "WHERE slug = %s AND is_current",
                (tool.slug,),
            )
            current = cur.fetchone()
            incoming = tuple(getattr(tool, attr) for attr in _TRACKED_ATTRIBUTES)

            if current is not None and tuple(current) == incoming:
                continue

            if current is not None:
                cur.execute(
                    "UPDATE dim_tool SET effective_to = %s, is_current = FALSE "
                    "WHERE slug = %s AND is_current",
                    (now, tool.slug),
                )

            cur.execute(
                "INSERT INTO dim_tool "
                "(slug, name, category, vendor, repo, homepage, effective_from, is_current) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)",
                (tool.slug, *incoming, now),
            )


def sync_sources(conn: psycopg.Connection, catalog: Catalog) -> dict[str, int]:
    """Registra una fuente github_releases por herramienta y devuelve sus ids."""
    ids: dict[str, int] = {}
    with conn.cursor() as cur:
        for tool in catalog.tools:
            if not tool.repo:
                continue
            cur.execute(
                "INSERT INTO sources (tool_slug, kind, url) VALUES (%s, 'github_releases', %s) "
                "ON CONFLICT (tool_slug, kind) DO UPDATE SET url = EXCLUDED.url "
                "RETURNING id",
                (tool.slug, f"https://api.github.com/repos/{tool.repo}/releases"),
            )
            ids[tool.slug] = cur.fetchone()[0]
    return ids
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `uv run pytest tests/test_db.py -v`
Expected: PASS, 8 tests

- [ ] **Step 5: Commit**

```bash
git add pipeline/db.py tests/test_db.py
git commit -m "feat: sincronización del catálogo con SCD tipo 2"
```

---

## Task 8: Persistencia de releases, capa raw y cuarentena

**Files:**
- Modify: `pipeline/db.py`
- Test: `tests/test_db.py`

**Interfaces:**
- Consumes: `ReleaseRecord` (Task 5), `connect` (Task 6)
- Produces:
  - `save_raw_fetch(conn, source_id: int, ds: date, payload: str) -> None` — upsert por `(source_id, content_hash)`: si el payload ya existe, solo mueve `last_seen_ds`
  - `upsert_releases(conn, records: list[ReleaseRecord]) -> int` — devuelve cuántos son nuevos
  - `quarantine(conn, source_ref: str, stage: str, error: str, payload: str | None) -> None`

- [ ] **Step 1: Escribir los tests que fallan**

Agregar a `tests/test_db.py`:

```python
from datetime import date

from pipeline.changes import ExtractedChange
from pipeline.db import quarantine, save_raw_fetch, upsert_releases
from pipeline.sources.github import ReleaseRecord

DS = date(2026, 8, 4)


def _record(version: str = "1.0.0", has_breaking: bool = False) -> ReleaseRecord:
    return ReleaseRecord(
        tool_slug="duckdb",
        version=version,
        published_at=T0,
        source_url="https://example.com/r",
        body="cuerpo",
        has_breaking=has_breaking,
        changes=[ExtractedChange(kind="breaking", text="rompió algo")] if has_breaking else [],
    )


def test_save_raw_fetch_stores_new_payload(db_conn):
    source_id = sync_sources(db_conn, _catalog())["duckdb"]
    save_raw_fetch(db_conn, source_id, DS, "contenido")

    with db_conn.cursor() as cur:
        cur.execute("SELECT payload, first_seen_ds, last_seen_ds FROM raw_fetches WHERE source_id = %s", (source_id,))
        payload, first_seen, last_seen = cur.fetchone()

    assert payload == "contenido"
    assert first_seen == DS
    assert last_seen == DS


def test_save_raw_fetch_does_not_duplicate_identical_payload(db_conn):
    source_id = sync_sources(db_conn, _catalog())["duckdb"]
    later = date(2026, 8, 5)

    save_raw_fetch(db_conn, source_id, DS, "sin cambios")
    save_raw_fetch(db_conn, source_id, later, "sin cambios")

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM raw_fetches WHERE source_id = %s", (source_id,))
        assert cur.fetchone()[0] == 1

        cur.execute("SELECT first_seen_ds, last_seen_ds FROM raw_fetches WHERE source_id = %s", (source_id,))
        first_seen, last_seen = cur.fetchone()

    assert first_seen == DS
    assert last_seen == later


def test_save_raw_fetch_stores_content_hash(db_conn):
    source_id = sync_sources(db_conn, _catalog())["duckdb"]
    save_raw_fetch(db_conn, source_id, DS, "contenido")

    with db_conn.cursor() as cur:
        cur.execute("SELECT content_hash FROM raw_fetches WHERE source_id = %s", (source_id,))
        assert len(cur.fetchone()[0]) == 64


def test_upsert_releases_inserts_new(db_conn):
    assert upsert_releases(db_conn, [_record()]) == 1

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM fct_release")
        assert cur.fetchone()[0] == 1


def test_upsert_releases_is_idempotent(db_conn):
    upsert_releases(db_conn, [_record()])
    assert upsert_releases(db_conn, [_record()]) == 0

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM fct_release")
        assert cur.fetchone()[0] == 1


def test_upsert_releases_stores_changes_without_duplicating(db_conn):
    upsert_releases(db_conn, [_record(has_breaking=True)])
    upsert_releases(db_conn, [_record(has_breaking=True)])

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM release_changes")
        assert cur.fetchone()[0] == 1


def test_quarantine_records_error_with_payload(db_conn):
    quarantine(db_conn, "duckdb:github_releases", "parse", "esquema inesperado", "{}")

    with db_conn.cursor() as cur:
        cur.execute("SELECT source_ref, stage, error, payload FROM quarantine")
        row = cur.fetchone()

    assert row == ("duckdb:github_releases", "parse", "esquema inesperado", "{}")
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `uv run pytest tests/test_db.py -v`
Expected: FAIL con `ImportError: cannot import name 'save_raw_fetch'`

- [ ] **Step 3: Implementar en `pipeline/db.py`**

Agregar al final del archivo (y `import hashlib` arriba, junto a los demás imports):

```python
import hashlib
from datetime import date

from pipeline.sources.github import ReleaseRecord


def save_raw_fetch(conn: psycopg.Connection, source_id: int, ds: date, payload: str) -> None:
    """Guarda el payload crudo, particionado por contenido en vez de por fecha.

    El free tier de Neon da 0.5 GB de storage; una fila diaria por fuente lo
    llenaría en meses cuando la mayoría de los días el payload no cambia. Si
    ya existe una fila con el mismo hash, solo se actualiza last_seen_ds.
    """
    content_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO raw_fetches (source_id, content_hash, first_seen_ds, last_seen_ds, payload) "
            "VALUES (%s, %s, %s, %s, %s) "
            "ON CONFLICT (source_id, content_hash) DO UPDATE "
            "SET last_seen_ds = GREATEST(raw_fetches.last_seen_ds, EXCLUDED.last_seen_ds)",
            (source_id, content_hash, ds, ds, payload),
        )


def upsert_releases(conn: psycopg.Connection, records: list[ReleaseRecord]) -> int:
    """Inserta releases nuevos por clave natural. Devuelve cuántos eran nuevos."""
    inserted = 0
    with conn.cursor() as cur:
        for record in records:
            cur.execute(
                "INSERT INTO fct_release "
                "(tool_slug, version, published_at, source_url, has_breaking, body) "
                "VALUES (%s, %s, %s, %s, %s, %s) "
                "ON CONFLICT (tool_slug, version) DO NOTHING "
                "RETURNING id",
                (
                    record.tool_slug,
                    record.version,
                    record.published_at,
                    record.source_url,
                    record.has_breaking,
                    record.body,
                ),
            )
            row = cur.fetchone()
            if row is None:
                continue

            inserted += 1
            release_id = row[0]
            for change in record.changes:
                cur.execute(
                    "INSERT INTO release_changes (release_id, kind, text) VALUES (%s, %s, %s) "
                    "ON CONFLICT (release_id, kind, text) DO NOTHING",
                    (release_id, change.kind, change.text),
                )

    return inserted


def quarantine(
    conn: psycopg.Connection,
    source_ref: str,
    stage: str,
    error: str,
    payload: str | None = None,
) -> None:
    """Aísla lo que falló validación, con contexto suficiente para depurarlo."""
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO quarantine (source_ref, stage, error, payload) VALUES (%s, %s, %s, %s)",
            (source_ref, stage, error, payload),
        )
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `uv run pytest tests/test_db.py -v`
Expected: PASS, 14 tests

- [ ] **Step 5: Commit**

```bash
git add pipeline/db.py tests/test_db.py
git commit -m "feat: capa raw, upsert idempotente de releases y cuarentena"
```

---

## Task 9: Entrypoint del pipeline

**Files:**
- Create: `pipeline/run.py`
- Test: `tests/test_run.py`

**Interfaces:**
- Consumes: todo lo anterior
- Produces:
  - `RunSummary` — dataclass: `tools_processed: int`, `releases_inserted: int`, `failures: int`
  - `run(conn, catalog: Catalog, token: str, ds: date, now: datetime, fetcher=fetch_releases) -> RunSummary`

`fetcher` se inyecta para poder testear el barrido completo sin red. Una fuente que falla no tumba a las demás: se registra en cuarentena, se incrementa su contador y el barrido sigue.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `tests/test_run.py`:

```python
from datetime import date, datetime, timezone

from pipeline.config import Catalog, Tool
from pipeline.fetch import PermanentError
from pipeline.run import RunSummary, run

DS = date(2026, 8, 4)
NOW = datetime(2026, 8, 4, tzinfo=timezone.utc)


def _catalog_of(*slugs: str) -> Catalog:
    return Catalog(
        tools=[
            Tool(slug=s, name=s.title(), category="test", repo=f"org/{s}")
            for s in slugs
        ]
    )


def _fake_fetcher(records_by_slug: dict, failing: set[str] | None = None):
    failing = failing or set()

    def fetcher(tool, token, **kwargs):
        if tool.slug in failing:
            raise PermanentError(f"{tool.slug} devolvió 404")
        return "{}", records_by_slug.get(tool.slug, [])

    return fetcher


def test_run_processes_every_tool(db_conn):
    from tests.test_db import _record

    summary = run(
        db_conn,
        _catalog_of("duckdb", "polars"),
        token="x",
        ds=DS,
        now=NOW,
        fetcher=_fake_fetcher({"duckdb": [_record()]}),
    )

    assert isinstance(summary, RunSummary)
    assert summary.tools_processed == 2
    assert summary.releases_inserted == 1
    assert summary.failures == 0


def test_run_is_idempotent(db_conn):
    from tests.test_db import _record

    fetcher = _fake_fetcher({"duckdb": [_record()]})
    run(db_conn, _catalog_of("duckdb"), token="x", ds=DS, now=NOW, fetcher=fetcher)
    second = run(db_conn, _catalog_of("duckdb"), token="x", ds=DS, now=NOW, fetcher=fetcher)

    assert second.releases_inserted == 0

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM fct_release")
        assert cur.fetchone()[0] == 1


def test_run_isolates_failing_source(db_conn):
    from tests.test_db import _record

    summary = run(
        db_conn,
        _catalog_of("duckdb", "polars"),
        token="x",
        ds=DS,
        now=NOW,
        fetcher=_fake_fetcher({"duckdb": [_record()]}, failing={"polars"}),
    )

    assert summary.failures == 1
    assert summary.releases_inserted == 1

    with db_conn.cursor() as cur:
        cur.execute("SELECT source_ref, stage FROM quarantine")
        assert cur.fetchone() == ("polars:github_releases", "fetch")


def test_run_increments_consecutive_failures(db_conn):
    fetcher = _fake_fetcher({}, failing={"polars"})
    run(db_conn, _catalog_of("polars"), token="x", ds=DS, now=NOW, fetcher=fetcher)
    run(db_conn, _catalog_of("polars"), token="x", ds=DS, now=NOW, fetcher=fetcher)

    with db_conn.cursor() as cur:
        cur.execute("SELECT consecutive_failures, is_degraded FROM sources WHERE tool_slug = 'polars'")
        failures, degraded = cur.fetchone()

    assert failures == 2
    assert degraded is False


def test_run_marks_source_degraded_after_three_failures(db_conn):
    fetcher = _fake_fetcher({}, failing={"polars"})
    for _ in range(3):
        run(db_conn, _catalog_of("polars"), token="x", ds=DS, now=NOW, fetcher=fetcher)

    with db_conn.cursor() as cur:
        cur.execute("SELECT is_degraded FROM sources WHERE tool_slug = 'polars'")
        assert cur.fetchone()[0] is True


def test_run_resets_failure_counter_on_success(db_conn):
    run(db_conn, _catalog_of("polars"), token="x", ds=DS, now=NOW, fetcher=_fake_fetcher({}, failing={"polars"}))
    run(db_conn, _catalog_of("polars"), token="x", ds=DS, now=NOW, fetcher=_fake_fetcher({}))

    with db_conn.cursor() as cur:
        cur.execute("SELECT consecutive_failures, last_success_at FROM sources WHERE tool_slug = 'polars'")
        failures, last_success = cur.fetchone()

    assert failures == 0
    assert last_success is not None


def test_run_saves_raw_payload(db_conn):
    run(db_conn, _catalog_of("duckdb"), token="x", ds=DS, now=NOW, fetcher=_fake_fetcher({}))

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM raw_fetches")
        assert cur.fetchone()[0] == 1


def test_run_does_not_grow_raw_fetches_when_payload_is_unchanged(db_conn):
    from datetime import timedelta

    fetcher = _fake_fetcher({})
    run(db_conn, _catalog_of("duckdb"), token="x", ds=DS, now=NOW, fetcher=fetcher)
    run(db_conn, _catalog_of("duckdb"), token="x", ds=DS + timedelta(days=1), now=NOW, fetcher=fetcher)

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM raw_fetches")
        assert cur.fetchone()[0] == 1
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `uv run pytest tests/test_run.py -v`
Expected: FAIL con `ModuleNotFoundError`

- [ ] **Step 3: Implementar `pipeline/run.py`**

```python
"""Entrypoint del pipeline: orquesta el barrido del catálogo.

Es el único módulo que sabe en qué orden ocurren las cosas. El fallo de una
fuente no afecta a las demás: se aísla, se registra y el barrido sigue.
"""

import logging
import os
import sys
import traceback
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path

import psycopg
from dotenv import load_dotenv

from pipeline.config import Catalog, load_catalog
from pipeline.db import (
    apply_migrations,
    connect,
    quarantine,
    save_raw_fetch,
    sync_catalog,
    sync_sources,
    upsert_releases,
)
from pipeline.sources.github import fetch_releases

DEGRADED_AFTER_FAILURES = 3

logger = logging.getLogger("de_radar")


@dataclass
class RunSummary:
    tools_processed: int = 0
    releases_inserted: int = 0
    failures: int = 0


def _record_failure(conn: psycopg.Connection, tool_slug: str, source_id: int, error: Exception) -> None:
    quarantine(
        conn,
        source_ref=f"{tool_slug}:github_releases",
        stage="fetch",
        error=f"{type(error).__name__}: {error}\n{traceback.format_exc()}",
        payload=None,
    )
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE sources SET consecutive_failures = consecutive_failures + 1, "
            "is_degraded = (consecutive_failures + 1) >= %s WHERE id = %s",
            (DEGRADED_AFTER_FAILURES, source_id),
        )


def _record_success(conn: psycopg.Connection, source_id: int, now: datetime) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE sources SET consecutive_failures = 0, is_degraded = FALSE, last_success_at = %s "
            "WHERE id = %s",
            (now, source_id),
        )


def run(
    conn: psycopg.Connection,
    catalog: Catalog,
    token: str,
    ds: date,
    now: datetime,
    fetcher=fetch_releases,
) -> RunSummary:
    """Barre el catálogo completo y devuelve el resumen de la corrida."""
    sync_catalog(conn, catalog, now)
    source_ids = sync_sources(conn, catalog)
    summary = RunSummary()

    for tool in catalog.tools:
        source_id = source_ids.get(tool.slug)
        if source_id is None:
            continue

        summary.tools_processed += 1
        try:
            payload, records = fetcher(tool, token)
        except Exception as error:
            logger.error(
                "fetch falló | herramienta=%s fuente=github_releases ds=%s",
                tool.slug,
                ds,
                exc_info=True,
            )
            _record_failure(conn, tool.slug, source_id, error)
            summary.failures += 1
            continue

        save_raw_fetch(conn, source_id, ds, payload)
        summary.releases_inserted += upsert_releases(conn, records)
        _record_success(conn, source_id, now)

    return summary


def main() -> int:
    load_dotenv()
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        stream=sys.stdout,
    )

    dsn = os.environ["DATABASE_URL"]
    token = os.environ["GH_API_TOKEN"]
    now = datetime.now(timezone.utc)

    conn = connect(dsn)
    try:
        apply_migrations(conn)
        summary = run(conn, load_catalog(Path("catalog/tools.yaml")), token, now.date(), now)
    finally:
        conn.close()

    logger.info(
        "corrida terminada | herramientas=%d releases_nuevos=%d fallos=%d",
        summary.tools_processed,
        summary.releases_inserted,
        summary.failures,
    )
    return 1 if summary.failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `uv run pytest tests/test_run.py -v`
Expected: PASS, 7 tests

- [ ] **Step 5: Correr el pipeline de verdad contra Neon**

```bash
uv run python -m pipeline.run
```

Expected: log con `corrida terminada | herramientas=10 releases_nuevos=<N> fallos=0`

- [ ] **Step 6: Verificar idempotencia en la base real**

```bash
uv run python -m pipeline.run
```

Expected: la segunda corrida reporta `releases_nuevos=0`

- [ ] **Step 7: Commit**

```bash
git add pipeline/run.py tests/test_run.py
git commit -m "feat: entrypoint del pipeline con aislamiento de fallos por fuente"
```

---

## Task 10: Transformación con dbt

**Files:**
- Create: `transform/dbt_project.yml`, `transform/profiles.yml`, `transform/models/staging/stg_tools.sql`, `transform/models/staging/stg_releases.sql`, `transform/models/staging/schema.yml`, `transform/models/marts/mart_changelog.sql`, `transform/models/marts/schema.yml`

**Interfaces:**
- Consumes: tablas `dim_tool`, `fct_release`, `release_changes` (Tasks 6-8)
- Produces: vista `mart_changelog` con columnas `tool_slug`, `tool_name`, `category`, `version`, `published_at`, `source_url`, `has_breaking`, `breaking_changes` (array de texto)

- [ ] **Step 1: Instalar dbt**

```bash
uv add --dev dbt-core dbt-postgres
```

- [ ] **Step 2: Crear `transform/dbt_project.yml`**

```yaml
name: de_radar
version: "1.0.0"
config-version: 2
profile: de_radar
model-paths: ["models"]
target-path: "target"
clean-targets: ["target", "dbt_packages"]

models:
  de_radar:
    staging:
      +materialized: view
    marts:
      +materialized: table
```

- [ ] **Step 3: Crear `transform/profiles.yml`**

```yaml
de_radar:
  target: dev
  outputs:
    dev:
      type: postgres
      host: "{{ env_var('PGHOST') }}"
      user: "{{ env_var('PGUSER') }}"
      password: "{{ env_var('PGPASSWORD') }}"
      port: "{{ env_var('PGPORT') | int }}"
      dbname: "{{ env_var('PGDATABASE') }}"
      schema: public
      threads: 4
```

- [ ] **Step 4: Crear los modelos de staging**

`transform/models/staging/stg_tools.sql`:

```sql
select
    tool_key,
    slug as tool_slug,
    name as tool_name,
    category,
    vendor,
    repo,
    homepage,
    effective_from,
    effective_to,
    is_current
from {{ source('de_radar', 'dim_tool') }}
```

`transform/models/staging/stg_releases.sql`:

```sql
select
    id as release_id,
    tool_slug,
    version,
    published_at,
    source_url,
    has_breaking,
    body,
    ingested_at
from {{ source('de_radar', 'fct_release') }}
```

- [ ] **Step 5: Crear `transform/models/staging/schema.yml` con las fuentes y los tests**

```yaml
version: 2

sources:
  - name: de_radar
    schema: public
    tables:
      - name: dim_tool
      - name: fct_release
      - name: release_changes

models:
  - name: stg_tools
    columns:
      - name: tool_slug
        tests: [not_null]
      - name: is_current
        tests: [not_null]

  - name: stg_releases
    columns:
      - name: release_id
        tests: [unique, not_null]
      - name: version
        tests: [not_null]
      - name: published_at
        tests: [not_null]
```

- [ ] **Step 6: Crear `transform/models/marts/mart_changelog.sql`**

```sql
with breaking as (
    select
        release_id,
        array_agg(text order by text) as breaking_changes
    from {{ source('de_radar', 'release_changes') }}
    where kind = 'breaking'
    group by release_id
)

select
    r.release_id,
    r.tool_slug,
    t.tool_name,
    t.category,
    r.version,
    r.published_at,
    r.source_url,
    r.has_breaking,
    coalesce(b.breaking_changes, array[]::text[]) as breaking_changes
from {{ ref('stg_releases') }} as r
inner join {{ ref('stg_tools') }} as t
    on r.tool_slug = t.tool_slug
    and t.is_current
left join breaking as b
    on r.release_id = b.release_id
```

- [ ] **Step 7: Crear `transform/models/marts/schema.yml` con los tests de calidad**

```yaml
version: 2

models:
  - name: mart_changelog
    tests:
      - dbt_utils.expression_is_true:
          expression: "published_at <= current_timestamp"
    columns:
      - name: release_id
        tests: [unique, not_null]
      - name: tool_slug
        tests: [not_null]
      - name: tool_name
        tests: [not_null]
      - name: version
        tests: [not_null]
      - name: has_breaking
        tests: [not_null]
```

> **Nota:** el test `dbt_utils.expression_is_true` requiere el paquete `dbt_utils`. Si preferís no agregar dependencias, reemplazá ese bloque por un test singular en `transform/tests/assert_no_future_releases.sql` con el contenido: `select * from {{ ref('mart_changelog') }} where published_at > current_timestamp`. Un test singular pasa cuando devuelve cero filas.

- [ ] **Step 8: Correr dbt**

```bash
cd transform
export PGHOST=... PGUSER=... PGPASSWORD=... PGPORT=5432 PGDATABASE=...
uv run dbt run
uv run dbt test
```

Expected: `dbt run` crea `mart_changelog`; `dbt test` pasa todos los tests.

- [ ] **Step 9: Commit**

```bash
git add transform/
git commit -m "feat: transformación dbt de raw a mart_changelog con tests de calidad"
```

---

## Task 11: Automatización en GitHub Actions

**Files:**
- Create: `.github/workflows/ingest.yml`

**Interfaces:**
- Consumes: `pipeline.run:main` (Task 9), proyecto dbt (Task 10)
- Produces: corrida diaria automatizada que abre un issue cuando falla

> Este workflow se modifica de nuevo en la Task 12 (Step 8) para agregar el paso de revalidación del sitio, una vez exista la ruta `/api/revalidate`. Es normal que quede incompleto — sin llamar a revalidar — hasta terminar la Task 12.

- [ ] **Step 1: Crear el workflow**

```yaml
name: ingest

on:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch:

permissions:
  contents: read
  issues: write

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: astral-sh/setup-uv@v5
        with:
          python-version: "3.12"

      - name: Ingestar releases
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          GH_API_TOKEN: ${{ secrets.GH_API_TOKEN }}
        run: uv run python -m pipeline.run

      - name: Transformar con dbt
        working-directory: transform
        env:
          PGHOST: ${{ secrets.PGHOST }}
          PGUSER: ${{ secrets.PGUSER }}
          PGPASSWORD: ${{ secrets.PGPASSWORD }}
          PGPORT: ${{ secrets.PGPORT }}
          PGDATABASE: ${{ secrets.PGDATABASE }}
        run: |
          uv run dbt run
          uv run dbt test

      - name: Abrir issue si la corrida falló
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Ingesta falló — ${new Date().toISOString().slice(0, 10)}`,
              body: `La corrida diaria falló.\n\nRun: ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
              labels: ['pipeline-failure']
            })
```

- [ ] **Step 2: Cargar los secretos de Postgres**

En Settings → Secrets and variables → Actions, agregar `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGPORT`, `PGDATABASE` con los valores de la connection string de Neon.

- [ ] **Step 3: Disparar el workflow a mano y verificar**

En la pestaña Actions → workflow `ingest` → Run workflow. Verificar que ambos pasos terminen en verde.

- [ ] **Step 4: Verificar que el issue automático funciona**

Cambiar temporalmente el secreto `GH_API_TOKEN` por un valor inválido, disparar el workflow, confirmar que se abre el issue, y restaurar el secreto.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ingest.yml
git commit -m "ci: corrida diaria con alerta por issue"
```

---

## Task 12: Sitio en Next.js

**Files:**
- Create: `web/` (proyecto Next.js), `web/lib/db.ts`, `web/app/page.tsx`

**Interfaces:**
- Consumes: vista `mart_changelog` (Task 10)
- Produces: sitio público con el changelog, revalidado on-demand por el pipeline (Task 11), no por polling

> **Por qué on-demand y no `revalidate` por tiempo:** con `revalidate = 3600` la página consultaría Postgres 24 veces al día así nadie la visite, y cada consulta despierta a Neon del autosuspend — el free tier da 100 CU-hrs/mes y ese patrón las gasta sin tráfico real. Con revalidación on-demand, Postgres solo recibe la consulta diaria del propio pipeline.

- [ ] **Step 1: Crear el proyecto**

```bash
npx create-next-app@latest web --typescript --app --tailwind --eslint --no-src-dir --import-alias "@/*" --yes
cd web && npm install postgres
```

- [ ] **Step 2: Crear `web/lib/db.ts`**

```typescript
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

export type ChangelogEntry = {
  release_id: number
  tool_slug: string
  tool_name: string
  category: string
  version: string
  published_at: Date
  source_url: string
  has_breaking: boolean
  breaking_changes: string[]
}

export async function getChangelog(limit = 100): Promise<ChangelogEntry[]> {
  return sql<ChangelogEntry[]>`
    select release_id, tool_slug, tool_name, category, version,
           published_at, source_url, has_breaking, breaking_changes
    from mart_changelog
    order by published_at desc
    limit ${limit}
  `
}
```

- [ ] **Step 3: Reemplazar `web/app/page.tsx`**

La página no declara `revalidate` por tiempo — la ruta `/api/revalidate` del Step 3b es quien controla cuándo se refresca, disparada por el pipeline una vez al día.

```tsx
import { getChangelog } from '@/lib/db'

export default async function Home() {
  const entries = await getChangelog()

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">DE Radar</h1>
      <p className="mt-2 text-neutral-500">
        Releases del ecosistema de Data Engineering, actualizados a diario.
      </p>

      <ul className="mt-10 space-y-6">
        {entries.map((entry) => (
          <li key={entry.release_id} className="border-b border-neutral-200 pb-6">
            <div className="flex items-baseline gap-3">
              <a href={entry.source_url} className="text-lg font-semibold hover:underline">
                {entry.tool_name} {entry.version}
              </a>
              {entry.has_breaking && (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  breaking
                </span>
              )}
            </div>

            <time className="text-sm text-neutral-500">
              {new Date(entry.published_at).toLocaleDateString('es-CO')}
            </time>

            {entry.breaking_changes.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {entry.breaking_changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 4: Correr en local y verificar**

```bash
cd web && DATABASE_URL="<connection-string>" npm run dev
```

Abrir `http://localhost:3000` y confirmar que aparecen releases reales, con las versiones normalizadas (sin la `v` inicial) y los breaking changes marcados.

- [ ] **Step 5: Crear la ruta de revalidación on-demand**

`web/app/api/revalidate/route.ts`:

```typescript
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'no autorizado' }, { status: 401 })
  }

  revalidatePath('/')
  return NextResponse.json({ revalidated: true })
}
```

Esta ruta es la única forma en que la home se refresca: el pipeline la llama al terminar cada corrida (Task 11, Step 1b). Sin tráfico, no hay ninguna consulta a Postgres — así se evita gastar las 100 CU-hrs/mes del free tier de Neon en despertares sin visitas.

- [ ] **Step 6: Desplegar en Vercel**

Importar el repo en Vercel con root directory `web`, y agregar `DATABASE_URL` y `REVALIDATE_SECRET` (un valor aleatorio propio, ej. `openssl rand -hex 32`) como variables de entorno.

- [ ] **Step 7: Commit**

```bash
git add web/
git commit -m "feat: sitio público con el changelog, revalidado on-demand"
```

- [ ] **Step 8: Conectar la revalidación al workflow de ingesta**

El workflow de la Task 11 ya corre `dbt run` diariamente; ahora que la ruta de revalidación existe, se agrega un paso final que la llama. Modificar `.github/workflows/ingest.yml`, agregando después del paso "Transformar con dbt":

```yaml
      - name: Revalidar el sitio
        run: |
          curl -sf -X POST "${{ secrets.VERCEL_APP_URL }}/api/revalidate" \
            -H "x-revalidate-secret: ${{ secrets.REVALIDATE_SECRET }}"
```

Cargar dos secretos nuevos en GitHub: `VERCEL_APP_URL` (la URL del deploy de Vercel, sin barra final) y `REVALIDATE_SECRET` (el mismo valor puesto en Vercel en el Step 6).

Disparar el workflow a mano y confirmar en los logs de Vercel que la ruta `/api/revalidate` recibió la llamada y devolvió `{"revalidated": true}`.

---

## Task 13: Verificación de siete días

Esta tarea no tiene código. Es la definición de listo de la Fase 1.

- [ ] **Step 1: Registrar el punto de partida**

Anotar en el vault la fecha de arranque y el conteo actual de releases:

```sql
select count(*) as releases, count(distinct tool_slug) as herramientas from fct_release;
```

- [ ] **Step 2: Revisar diariamente durante siete días**

Cada día, sin intervenir en el pipeline, verificar:

```sql
-- cuarentena: idealmente vacía
select source_ref, stage, error, occurred_at from quarantine order by occurred_at desc limit 20;

-- fuentes degradadas: idealmente ninguna
select tool_slug, consecutive_failures, last_success_at from sources where is_degraded;

-- duplicados: debe devolver cero filas
select tool_slug, version, count(*) from fct_release group by 1, 2 having count(*) > 1;

-- versiones sin normalizar: debe devolver cero filas
select version from fct_release where version like 'v%';
```

- [ ] **Step 3: Verificar el sitio**

Confirmar que la web muestra los releases nuevos sin desplegar nada a mano.

- [ ] **Step 4: Cerrar la fase**

Si a los siete días no hubo intervención manual, ni duplicados, ni datos falsos: Fase 1 terminada. Actualizar el estado en `DE Radar.md` del vault y llenar el catálogo hasta las 25 herramientas.

Si hubo intervención: anotar qué la causó, corregirlo, y reiniciar el conteo de siete días.

---

## Notas para quien implemente

- **El typo en la Task 6 es deliberado.** Está ahí para que el ciclo de test falle por una razón real antes de pasar. Si lo corregís de una, el test igual pasa; no es una trampa, es un recordatorio de correr el test antes de dar por bueno el SQL.
- **`tests/test_run.py` importa helpers de `tests/test_db.py`.** Es acoplamiento entre tests, aceptable acá porque `_record` y `_catalog` son constructores de fixtures. Si crece, muévanlos a `tests/factories.py`.
- **Ninguna tarea agrega herramientas al catálogo por código.** Si en algún momento te encontrás escribiendo `if tool.slug == "airflow"`, parate: eso viola la decisión 7 del diseño.
