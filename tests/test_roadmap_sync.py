"""sync_roadmap borra y reescribe: el grafo no lleva historial (git ya lo tiene)."""

from pipeline.db import sync_roadmap
from pipeline.roadmap import Experience, Implementation, Roadmap, RoadmapNode, Source


def _grafo(*nodes: RoadmapNode) -> Roadmap:
    return Roadmap(nodes=list(nodes))


def _nodo(slug: str, **extra) -> RoadmapNode:
    base = dict(
        slug=slug, tipo="concepto", nombre=slug.upper(),
        resuelve="algo", dominado_cuando="podés hacer algo", nivel=0,
    )
    base.update(extra)
    return RoadmapNode(**base)


def test_inserta_nodos_aristas_e_hijos(db_conn):
    sync_roadmap(db_conn, _grafo(
        _nodo("sql", fuentes=[Source(url="https://x.dev", por_que="oficial")]),
        _nodo("ingesta", nivel=1, prerequisitos=["sql"],
              lo_vi_romperse=Experience(texto="se rompió", link="https://c/1"),
              implementaciones=[Implementation(nombre="Airflow", tool_slug="airflow")]),
    ))
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM roadmap_node")
        assert cur.fetchone()[0] == 2
        cur.execute("SELECT from_slug, to_slug FROM roadmap_edge")
        assert cur.fetchall() == [("sql", "ingesta")]
        cur.execute("SELECT node_slug, texto FROM roadmap_experience")
        assert cur.fetchall() == [("ingesta", "se rompió")]
        cur.execute("SELECT node_slug, url FROM roadmap_source")
        assert cur.fetchall() == [("sql", "https://x.dev")]
        cur.execute("SELECT node_slug, nombre, tool_slug FROM roadmap_implementation")
        assert cur.fetchall() == [("ingesta", "Airflow", "airflow")]


def test_es_idempotente(db_conn):
    grafo = _grafo(_nodo("sql"), _nodo("ingesta", nivel=1, prerequisitos=["sql"]))
    sync_roadmap(db_conn, grafo)
    sync_roadmap(db_conn, grafo)
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM roadmap_node")
        assert cur.fetchone()[0] == 2
        cur.execute("SELECT count(*) FROM roadmap_edge")
        assert cur.fetchone()[0] == 1


def test_borra_nodos_que_salieron_del_grafo(db_conn):
    sync_roadmap(db_conn, _grafo(_nodo("sql"), _nodo("viejo")))
    sync_roadmap(db_conn, _grafo(_nodo("sql")))
    with db_conn.cursor() as cur:
        cur.execute("SELECT slug FROM roadmap_node")
        assert cur.fetchall() == [("sql",)]


def test_actualiza_texto_de_un_nodo_existente(db_conn):
    sync_roadmap(db_conn, _grafo(_nodo("sql", resuelve="viejo")))
    sync_roadmap(db_conn, _grafo(_nodo("sql", resuelve="nuevo")))
    with db_conn.cursor() as cur:
        cur.execute("SELECT resuelve FROM roadmap_node WHERE slug = 'sql'")
        assert cur.fetchone()[0] == "nuevo"


def test_quitar_la_experiencia_la_borra(db_conn):
    """Si se saca el lo_vi_romperse del YAML, el marcador vuelve a aparecer."""
    sync_roadmap(db_conn, _grafo(_nodo("sql", lo_vi_romperse=Experience(texto="t"))))
    sync_roadmap(db_conn, _grafo(_nodo("sql")))
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM roadmap_experience")
        assert cur.fetchone()[0] == 0
