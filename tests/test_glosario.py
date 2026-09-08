"""El validador del glosario. Un validador que nunca rechaza no valida
(decisión 17 de DE Radar): cada caso inválido de acá debe hacer fallar la
carga."""

from pathlib import Path

import pytest
import yaml

from pipeline.glosario import GlosarioError, load_glosario
from pipeline.roadmap import Roadmap, RoadmapNode


def _roadmap(niveles: dict[int, str] | None = None, extra_nodo: str | None = None) -> Roadmap:
    nodes = [RoadmapNode(
        slug="sql", tipo="herramienta", nombre="SQL",
        resuelve="x", dominado_cuando="y", nivel=0,
    )]
    if extra_nodo:
        nodes.append(RoadmapNode(
            slug=extra_nodo, tipo="concepto", nombre=extra_nodo,
            resuelve="x", dominado_cuando="y", nivel=0,
        ))
    return Roadmap(nodes=nodes, niveles=niveles or {})


def _escribir(tmp_path: Path, terminos: list[dict]) -> Path:
    path = tmp_path / "glosario.yaml"
    path.write_text(yaml.safe_dump({"terminos": terminos}, allow_unicode=True))
    return path


def _termino(slug: str, **extra) -> dict:
    base = {
        "slug": slug,
        "termino": slug.upper(),
        "definicion": "algo",
        "nivel": 0,
        "fuentes": [{"url": "https://x.dev", "por_que": "oficial"}],
    }
    base.update(extra)
    return base


def test_carga_un_glosario_valido(tmp_path):
    path = _escribir(tmp_path, [_termino("xcom")])
    glosario = load_glosario(path, _roadmap(niveles={0: "Base"}))
    assert [t.slug for t in glosario.terminos] == ["xcom"]


def test_rechaza_slug_duplicado(tmp_path):
    path = _escribir(tmp_path, [_termino("xcom"), _termino("xcom")])
    with pytest.raises(GlosarioError, match="duplicado"):
        load_glosario(path, _roadmap())


def test_rechaza_slug_que_colisiona_con_un_nodo(tmp_path):
    path = _escribir(tmp_path, [_termino("sql")])
    with pytest.raises(GlosarioError, match="colisiona"):
        load_glosario(path, _roadmap())


def test_rechaza_slug_no_apto_para_url(tmp_path):
    path = _escribir(tmp_path, [_termino("XCom Feo")])
    with pytest.raises(GlosarioError, match="URL"):
        load_glosario(path, _roadmap())


def test_rechaza_nivel_no_declarado(tmp_path):
    path = _escribir(tmp_path, [_termino("xcom", nivel=6)])
    with pytest.raises(GlosarioError, match="nivel"):
        load_glosario(path, _roadmap(niveles={0: "Base"}))


def test_rechaza_nodo_relacionado_inexistente(tmp_path):
    path = _escribir(tmp_path, [_termino("xcom", nodo_relacionado="fantasma")])
    with pytest.raises(GlosarioError, match="fantasma"):
        load_glosario(path, _roadmap())


def test_rechaza_termino_sin_fuentes(tmp_path):
    path = _escribir(tmp_path, [{
        "slug": "xcom", "termino": "XCom", "definicion": "algo", "nivel": 0, "fuentes": [],
    }])
    with pytest.raises(GlosarioError, match="glosario inválido"):
        load_glosario(path, _roadmap())


def test_rechaza_definicion_vacia_tras_strip(tmp_path):
    path = _escribir(tmp_path, [_termino("xcom", definicion="   ")])
    with pytest.raises(GlosarioError, match="glosario inválido"):
        load_glosario(path, _roadmap())


def test_rechaza_por_que_vacio_tras_strip(tmp_path):
    path = _escribir(tmp_path, [_termino(
        "xcom", fuentes=[{"url": "https://x.dev", "por_que": "  "}],
    )])
    with pytest.raises(GlosarioError, match="glosario inválido"):
        load_glosario(path, _roadmap())


def test_rechaza_uso_link_sin_uso_texto(tmp_path):
    path = _escribir(tmp_path, [_termino("xcom", uso_link="https://x.dev/commit/1")])
    with pytest.raises(GlosarioError, match="glosario inválido"):
        load_glosario(path, _roadmap())


def test_acepta_uso_link_con_uso_texto(tmp_path):
    path = _escribir(tmp_path, [_termino(
        "xcom", uso_texto="se usó acá", uso_link="https://x.dev/commit/1",
    )])
    glosario = load_glosario(path, _roadmap())
    assert glosario.terminos[0].uso_link == "https://x.dev/commit/1"


def test_rechaza_nivel_declarado_sin_ningun_nodo_ni_termino(tmp_path):
    """El bug del nivel 9 saltado, convertido en test: un nivel declarado
    que ningún nodo ni término usa no debería poder existir."""
    path = _escribir(tmp_path, [_termino("xcom", nivel=0)])
    with pytest.raises(GlosarioError, match="niveles declarados sin"):
        load_glosario(path, _roadmap(niveles={0: "Base", 9: "Huérfano"}))


def test_rechaza_termino_vacio_tras_strip(tmp_path):
    path = _escribir(tmp_path, [_termino("xcom", termino="   ")])
    with pytest.raises(GlosarioError, match="glosario inválido"):
        load_glosario(path, _roadmap())


def test_rechaza_url_vacia_tras_strip(tmp_path):
    path = _escribir(tmp_path, [_termino(
        "xcom", fuentes=[{"url": "   ", "por_que": "oficial"}],
    )])
    with pytest.raises(GlosarioError, match="glosario inválido"):
        load_glosario(path, _roadmap())
