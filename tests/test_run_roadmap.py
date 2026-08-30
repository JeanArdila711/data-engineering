from pipeline.roadmap import Roadmap, RoadmapNode
from pipeline.run_roadmap import run


def _nodo(slug: str) -> RoadmapNode:
    return RoadmapNode(
        slug=slug, tipo="concepto", nombre=slug.upper(),
        resuelve="algo", dominado_cuando="podés hacer algo", nivel=0,
    )


def test_run_devuelve_la_cantidad_de_nodos(db_conn):
    assert run(db_conn, Roadmap(nodes=[_nodo("a"), _nodo("b")])) == 2


def test_run_es_idempotente(db_conn):
    roadmap = Roadmap(nodes=[_nodo("a")])
    run(db_conn, roadmap)
    run(db_conn, roadmap)
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM roadmap_node")
        assert cur.fetchone()[0] == 1
