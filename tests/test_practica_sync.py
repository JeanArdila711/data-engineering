"""sync_roadmap gana la sincronización de recursos de práctica externa y
retos (Fase 1 de Guía de Práctica). Mismo criterio que test_roadmap_sync.py:
borra y reescribe, sin historial."""

from pipeline.db import sync_roadmap
from pipeline.roadmap import Objetivo, Reto, Roadmap, RoadmapNode, RecursoPractica


def _grafo(*, nodes: list[RoadmapNode], objetivos: list[Objetivo] | None = None) -> Roadmap:
    return Roadmap(nodes=nodes, objetivos=objetivos or [])


def _nodo(slug: str, **extra) -> RoadmapNode:
    base = dict(
        slug=slug, tipo="concepto", nombre=slug.upper(),
        resuelve="algo", dominado_cuando="podés hacer algo", nivel=0,
    )
    base.update(extra)
    return RoadmapNode(**base)


def _objetivo(slug: str, metas: list[str], **extra) -> Objetivo:
    base = dict(slug=slug, nombre=slug, descripcion="d", metas=metas, reto_ausente="sin reto")
    base.update(extra)
    return Objetivo(**base)


def test_sincroniza_recursos_de_practica(db_conn):
    sync_roadmap(db_conn, _grafo(nodes=[
        _nodo("sql", practica_externa=[
            RecursoPractica(nombre="PgExercises", url="https://pgexercises.com/", por_que="x"),
        ]),
    ]))
    with db_conn.cursor() as cur:
        cur.execute("SELECT node_slug, nombre, url FROM roadmap_practice_resource")
        assert cur.fetchall() == [("sql", "PgExercises", "https://pgexercises.com/")]


def test_recursos_de_practica_es_idempotente(db_conn):
    grafo = _grafo(nodes=[
        _nodo("sql", practica_externa=[
            RecursoPractica(nombre="PgExercises", url="https://pgexercises.com/", por_que="x"),
        ]),
    ])
    sync_roadmap(db_conn, grafo)
    sync_roadmap(db_conn, grafo)
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM roadmap_practice_resource")
        assert cur.fetchone()[0] == 1


def test_borra_recurso_de_practica_que_salio_del_yaml(db_conn):
    sync_roadmap(db_conn, _grafo(nodes=[
        _nodo("sql", practica_externa=[
            RecursoPractica(nombre="PgExercises", url="https://pgexercises.com/", por_que="x"),
        ]),
    ]))
    sync_roadmap(db_conn, _grafo(nodes=[_nodo("sql")]))
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM roadmap_practice_resource")
        assert cur.fetchone()[0] == 0


def test_sincroniza_reto_con_checklist(db_conn):
    sync_roadmap(db_conn, _grafo(
        nodes=[_nodo("a"), _nodo("b", nivel=1, prerequisitos=["a"])],
        objetivos=[_objetivo("pipelines-batch", ["b"], reto=Reto(escenario="hacé algo", checklist=["a", "b"]), reto_ausente=None)],
    ))
    with db_conn.cursor() as cur:
        cur.execute("SELECT objetivo_slug, escenario, motivo_ausencia FROM roadmap_challenge")
        assert cur.fetchall() == [("pipelines-batch", "hacé algo", None)]
        cur.execute("SELECT node_slug, orden FROM roadmap_challenge_check ORDER BY orden")
        assert cur.fetchall() == [("a", 0), ("b", 1)]


def test_sincroniza_objetivo_sin_reto(db_conn):
    sync_roadmap(db_conn, _grafo(
        nodes=[_nodo("a")],
        objetivos=[_objetivo("streaming", ["a"], reto_ausente="todavía no lo practiqué")],
    ))
    with db_conn.cursor() as cur:
        cur.execute("SELECT objetivo_slug, escenario, motivo_ausencia FROM roadmap_challenge")
        assert cur.fetchall() == [("streaming", None, "todavía no lo practiqué")]
        cur.execute("SELECT count(*) FROM roadmap_challenge_check")
        assert cur.fetchone()[0] == 0


def test_reto_es_idempotente(db_conn):
    grafo = _grafo(
        nodes=[_nodo("a")],
        objetivos=[_objetivo("pipelines-batch", ["a"], reto=Reto(escenario="x", checklist=["a"]), reto_ausente=None)],
    )
    sync_roadmap(db_conn, grafo)
    sync_roadmap(db_conn, grafo)
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM roadmap_challenge")
        assert cur.fetchone()[0] == 1
        cur.execute("SELECT count(*) FROM roadmap_challenge_check")
        assert cur.fetchone()[0] == 1


def test_borra_challenge_de_objetivo_que_salio_del_yaml(db_conn):
    sync_roadmap(db_conn, _grafo(
        nodes=[_nodo("a")],
        objetivos=[_objetivo("pipelines-batch", ["a"], reto=Reto(escenario="x", checklist=["a"]), reto_ausente=None)],
    ))
    sync_roadmap(db_conn, _grafo(nodes=[_nodo("a")], objetivos=[]))
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM roadmap_challenge")
        assert cur.fetchone()[0] == 0
        cur.execute("SELECT count(*) FROM roadmap_challenge_check")
        assert cur.fetchone()[0] == 0
