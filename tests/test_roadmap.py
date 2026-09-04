"""El validador del grafo. Un validador que nunca rechaza no valida:
cada caso inválido de acá debe hacer fallar la carga (decisión 17 de DE Radar).
"""

import json
from pathlib import Path

import pytest
import yaml

from pipeline.config import Catalog, Tool, load_catalog
from pipeline.roadmap import Objetivo, PuntoDePartida, Roadmap, RoadmapError, RoadmapNode, derivar_ruta, load_roadmap, rutas_esperadas

CATALOGO = Catalog(tools=[Tool(slug="airflow", name="Apache Airflow", category="orchestration")])


def _escribir(tmp_path: Path, nodes: list[dict], **extra) -> Path:
    path = tmp_path / "roadmap.yaml"
    path.write_text(yaml.safe_dump({"nodes": nodes, **extra}, allow_unicode=True))
    return path


def _objetivo(slug="batch", metas=("b",), **extra) -> dict:
    return {"slug": slug, "nombre": slug, "descripcion": "d", "metas": list(metas), **extra}


def _partida(slug="cero", conocidos=(), **extra) -> dict:
    return {"slug": slug, "nombre": slug, "descripcion": "d", "conocidos": list(conocidos), **extra}


def _nodo(slug: str, **extra) -> dict:
    base = {
        "slug": slug,
        "tipo": "concepto",
        "nombre": slug.upper(),
        "resuelve": "algo",
        "dominado_cuando": "podés hacer algo",
        "nivel": 0,
    }
    base.update(extra)
    return base


def test_carga_un_grafo_valido(tmp_path):
    path = _escribir(tmp_path, [
        _nodo("sql"),
        _nodo("ingesta", nivel=1, prerequisitos=["sql"],
              implementaciones=[{"nombre": "Airflow", "tool_slug": "airflow"}]),
    ])
    roadmap = load_roadmap(path, CATALOGO)
    assert [n.slug for n in roadmap.nodes] == ["sql", "ingesta"]


def test_rechaza_ciclo(tmp_path):
    path = _escribir(tmp_path, [
        _nodo("a", prerequisitos=["b"]),
        _nodo("b", prerequisitos=["a"]),
    ])
    with pytest.raises(RoadmapError, match="ciclo"):
        load_roadmap(path, CATALOGO)


def test_rechaza_ciclo_indirecto(tmp_path):
    path = _escribir(tmp_path, [
        _nodo("a", prerequisitos=["c"]),
        _nodo("b", prerequisitos=["a"]),
        _nodo("c", prerequisitos=["b"]),
    ])
    with pytest.raises(RoadmapError, match="ciclo"):
        load_roadmap(path, CATALOGO)


def test_rechaza_prerequisito_de_nivel_superior(tmp_path):
    """El front agrupa por nivel: un prerequisito de nivel mayor se
    renderizaria DESPUES del nodo que lo necesita."""
    path = _escribir(tmp_path, [
        _nodo("orquestacion", nivel=6),
        _nodo("idempotencia", nivel=2, prerequisitos=["orquestacion"]),
    ])
    with pytest.raises(RoadmapError, match="nivel"):
        load_roadmap(path, CATALOGO)


def test_rechaza_prerequisito_inexistente(tmp_path):
    path = _escribir(tmp_path, [_nodo("a", prerequisitos=["fantasma"])])
    with pytest.raises(RoadmapError, match="fantasma"):
        load_roadmap(path, CATALOGO)


def test_rechaza_slug_duplicado(tmp_path):
    path = _escribir(tmp_path, [_nodo("a"), _nodo("a")])
    with pytest.raises(RoadmapError, match="duplicado"):
        load_roadmap(path, CATALOGO)


def test_rechaza_tool_slug_que_no_esta_en_el_catalogo(tmp_path):
    """Un slug mal escrito rompería la capa de datos vivos en silencio:
    el nodo se vería bien pero vacío y nadie lo notaría."""
    path = _escribir(tmp_path, [
        _nodo("a", implementaciones=[{"nombre": "Airflow", "tool_slug": "airfloww"}]),
    ])
    with pytest.raises(RoadmapError, match="airfloww"):
        load_roadmap(path, CATALOGO)


def test_acepta_implementacion_sin_tool_slug(tmp_path):
    path = _escribir(tmp_path, [
        _nodo("a", implementaciones=[{"nombre": "Docker"}]),
    ])
    assert load_roadmap(path, CATALOGO).nodes[0].implementaciones[0].tool_slug is None


def test_rechaza_equivalencia_media_sin_nota(tmp_path):
    path = _escribir(tmp_path, [
        _nodo("wh", tipo="capacidad-cloud", implementaciones=[
            {"nombre": "BigQuery", "proveedor": "gcp", "equivalencia": "media"},
        ]),
    ])
    with pytest.raises(RoadmapError, match="nota"):
        load_roadmap(path, CATALOGO)


def test_rechaza_equivalencia_en_nodo_que_no_es_cloud(tmp_path):
    path = _escribir(tmp_path, [
        _nodo("a", implementaciones=[
            {"nombre": "X", "proveedor": "aws", "equivalencia": "alta"},
        ]),
    ])
    with pytest.raises(RoadmapError, match="capacidad-cloud"):
        load_roadmap(path, CATALOGO)


def test_rechaza_tipo_invalido(tmp_path):
    path = _escribir(tmp_path, [_nodo("a", tipo="inventado")])
    with pytest.raises(RoadmapError):
        load_roadmap(path, CATALOGO)


def test_rechaza_grafo_vacio(tmp_path):
    """Un YAML truncado o mal indentado parsea como lista vacía: sin este
    chequeo, sync_roadmap borraría la tabla entera sin ninguna señal."""
    path = _escribir(tmp_path, [])
    with pytest.raises(RoadmapError, match="vac"):
        load_roadmap(path, CATALOGO)


def test_rechaza_duplicados_dentro_de_un_nodo(tmp_path):
    """Prerequisitos, fuentes o implementaciones repetidas dentro de un mismo
    nodo violarían un UNIQUE a mitad del bucle de sync_roadmap, dejando estado
    parcial escrito porque la conexión usa autocommit=True."""
    path = _escribir(tmp_path, [
        _nodo("a", prerequisitos=["b", "b"]),
        _nodo("b"),
    ])
    with pytest.raises(RoadmapError, match="prerequisito"):
        load_roadmap(path, CATALOGO)

    path = _escribir(tmp_path, [
        _nodo("a", fuentes=[
            {"url": "http://x", "por_que": "y"},
            {"url": "http://x", "por_que": "z"},
        ]),
    ])
    with pytest.raises(RoadmapError, match="fuente"):
        load_roadmap(path, CATALOGO)

    path = _escribir(tmp_path, [
        _nodo("a", implementaciones=[
            {"nombre": "Airflow", "tool_slug": "airflow"},
            {"nombre": "Airflow"},
        ]),
    ])
    with pytest.raises(RoadmapError, match="implementaci"):
        load_roadmap(path, CATALOGO)


def test_carga_opciones_del_wizard(tmp_path):
    path = _escribir(
        tmp_path, [_nodo("a"), _nodo("b", nivel=1, prerequisitos=["a"])],
        objetivos=[_objetivo()], puntos_de_partida=[_partida(), _partida("sabe-a", ["a"])],
    )
    roadmap = load_roadmap(path, CATALOGO)
    assert [o.slug for o in roadmap.objetivos] == ["batch"]
    assert [p.slug for p in roadmap.puntos_de_partida] == ["cero", "sabe-a"]


def test_rechaza_meta_inexistente(tmp_path):
    path = _escribir(tmp_path, [_nodo("a")], objetivos=[_objetivo(metas=["zzz"])])
    with pytest.raises(RoadmapError, match="zzz"):
        load_roadmap(path, CATALOGO)


def test_rechaza_conocido_inexistente(tmp_path):
    path = _escribir(tmp_path, [_nodo("a")], puntos_de_partida=[_partida(conocidos=["zzz"])])
    with pytest.raises(RoadmapError, match="zzz"):
        load_roadmap(path, CATALOGO)


def test_rechaza_objetivo_sin_metas(tmp_path):
    """Un objetivo sin metas produce una ruta vacía para todo el mundo."""
    path = _escribir(tmp_path, [_nodo("a")], objetivos=[_objetivo(metas=[])])
    with pytest.raises(RoadmapError, match="metas"):
        load_roadmap(path, CATALOGO)


def test_rechaza_slug_de_opcion_no_apto_para_url(tmp_path):
    path = _escribir(tmp_path, [_nodo("a")], objetivos=[_objetivo(slug="Pipelines Batch", metas=["a"])])
    with pytest.raises(RoadmapError, match="URL"):
        load_roadmap(path, CATALOGO)


def test_rechaza_slug_de_opcion_duplicado(tmp_path):
    path = _escribir(
        tmp_path, [_nodo("a")],
        objetivos=[_objetivo(metas=["a"]), _objetivo(metas=["a"])],
    )
    with pytest.raises(RoadmapError, match="duplicado"):
        load_roadmap(path, CATALOGO)


def test_rechaza_meta_repetida_dentro_de_un_objetivo(tmp_path):
    path = _escribir(tmp_path, [_nodo("a")], objetivos=[_objetivo(metas=["a", "a"])])
    with pytest.raises(RoadmapError, match="repite"):
        load_roadmap(path, CATALOGO)


def test_clausura_incluye_prerequisitos_transitivos():
    from pipeline.roadmap import RoadmapNode, clausura_prerequisitos

    nodes = [
        RoadmapNode(**_nodo("a")),
        RoadmapNode(**_nodo("b", prerequisitos=["a"])),
        RoadmapNode(**_nodo("c", prerequisitos=["b"])),
        RoadmapNode(**_nodo("d")),
    ]
    assert clausura_prerequisitos(nodes, ["c"]) == {"a", "b", "c"}
    assert clausura_prerequisitos(nodes, []) == set()


def test_la_clausura_no_truena_con_un_prerequisito_huerfano():
    from pipeline.roadmap import RoadmapNode, clausura_prerequisitos

    nodes = [RoadmapNode(**_nodo("a", prerequisitos=["zzz"]))]
    resultado = clausura_prerequisitos(nodes, ["a"])
    assert resultado == {"a"}
    assert "zzz" not in resultado


# --- Fase 4: derivación en Python, atada a TS por el fixture dorado ---

FIXTURE = Path("tests/fixtures/rutas_esperadas.json")


def _roadmap_del_fixture(datos: dict) -> Roadmap:
    nodes = [
        RoadmapNode(slug=n["slug"], tipo="concepto", nombre=n["slug"], resuelve="", dominado_cuando="",
                    nivel=n["nivel"], orden_sugerido=n["orden_sugerido"], prerequisitos=n["prerequisitos"])
        for n in datos["grafo"]
    ]
    objetivos = [Objetivo(slug=s, nombre=s, descripcion="", metas=m) for s, m in datos["objetivos"].items()]
    partidas = [PuntoDePartida(slug=s, nombre=s, descripcion="", conocidos=c) for s, c in datos["partidas"].items()]
    return Roadmap(nodes=nodes, objetivos=objetivos, puntos_de_partida=partidas)


def test_derivar_ruta_coincide_con_el_fixture():
    datos = json.loads(FIXTURE.read_text())
    roadmap = _roadmap_del_fixture(datos)
    objetivos = {o.slug: o for o in roadmap.objetivos}
    partidas = {p.slug: p for p in roadmap.puntos_de_partida}
    assert datos["rutas"], "el fixture no tiene combinaciones"
    for clave, esperado in datos["rutas"].items():
        o, p = clave.split("/")
        ruta, sabidos = derivar_ruta(roadmap, objetivos[o], partidas[p])
        assert [n.slug for n in ruta] == esperado["ruta"], clave
        assert [n.slug for n in sabidos] == esperado["sabidos"], clave


def test_el_fixture_esta_al_dia_con_el_yaml_real():
    roadmap = load_roadmap(Path("catalog/roadmap.yaml"), load_catalog(Path("catalog/tools.yaml")))
    assert rutas_esperadas(roadmap) == json.loads(FIXTURE.read_text()), (
        "el grafo cambió y el fixture no: "
        "uv run python -m pipeline.roadmap --rutas-esperadas > tests/fixtures/rutas_esperadas.json"
    )


def test_derivar_ruta_pone_prerequisitos_antes_y_resta_lo_sabido():
    # a <- b <- c ; e <- f ; d suelto — mismo grafo que web/lib/roadmap.test.ts
    nodes = [
        RoadmapNode(slug=s, tipo="concepto", nombre=s, resuelve="", dominado_cuando="", nivel=nv, prerequisitos=pr)
        for s, pr, nv in [("a", [], 0), ("b", ["a"], 1), ("c", ["b"], 2), ("d", [], 0), ("e", [], 0), ("f", ["e"], 1)]
    ]
    roadmap = Roadmap(nodes=nodes)
    ruta, sabidos = derivar_ruta(
        roadmap,
        Objetivo(slug="o", nombre="o", descripcion="", metas=["c", "f"]),
        PuntoDePartida(slug="p", nombre="p", descripcion="", conocidos=["b"]),
    )
    assert [n.slug for n in ruta] == ["e", "f", "c"]
    assert [n.slug for n in sabidos] == ["a", "b"]
