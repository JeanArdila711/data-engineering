"""El grafo real del repo tiene que validar, y su contenido tiene que ser honesto."""

from pathlib import Path

from pipeline.config import load_catalog
from pipeline.roadmap import load_roadmap

CATALOGO = load_catalog(Path("catalog/tools.yaml"))
ROADMAP = load_roadmap(Path("catalog/roadmap.yaml"), CATALOGO)

# Nodos con evidencia real documentada en Ruta DE.md. Cualquier lo_vi_romperse
# fuera de esta lista es inventado, y ese es el peor resultado del proyecto.
CON_EVIDENCIA = {
    "sql", "python-para-datos", "git",
    "ingesta-desacoplada", "idempotencia", "carga-incremental", "salud-de-fuentes",
    "zonas-y-capas", "particionamiento", "oltp-vs-olap",
    "modelado-dimensional", "historizacion-scd",
    "elt-y-capas-de-transformacion", "calidad-y-tests-de-datos",
    "orquestacion", "backfill-y-reprocesamiento",
    "observabilidad", "costo",
}


def test_el_grafo_del_repo_valida():
    assert len(ROADMAP.nodes) >= 27


def test_solo_los_nodos_con_evidencia_tienen_experiencia():
    con_experiencia = {n.slug for n in ROADMAP.nodes if n.lo_vi_romperse is not None}
    assert con_experiencia <= CON_EVIDENCIA, (
        f"nodos con lo_vi_romperse sin evidencia documentada: "
        f"{sorted(con_experiencia - CON_EVIDENCIA)}"
    )


def test_todo_nodo_tiene_al_menos_una_fuente():
    sin_fuentes = [n.slug for n in ROADMAP.nodes if not n.fuentes]
    assert not sin_fuentes, f"nodos sin fuentes: {sin_fuentes}"


def test_los_nodos_cloud_declaran_proveedor_en_toda_implementacion():
    for node in ROADMAP.nodes:
        if node.tipo != "capacidad-cloud":
            continue
        for impl in node.implementaciones:
            assert impl.proveedor is not None, f"{node.slug}/{impl.nombre} sin proveedor"


def test_existe_al_menos_un_nodo_raiz():
    assert any(not n.prerequisitos for n in ROADMAP.nodes)
