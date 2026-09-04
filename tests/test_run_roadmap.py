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


class _LLMRoto:
    def draft_route_blurb(self, **kwargs):
        raise RuntimeError("sin red")


class _ConnQueRevientaEnBlurbs:
    """Un error de base adentro de blurbs (no del LLM) tampoco tumba la corrida."""
    def __init__(self, real):
        self._real = real
        self.cursores = 0

    def cursor(self):
        self.cursores += 1
        if self.cursores > 1:  # el primero es sync_roadmap
            raise RuntimeError("base caída")
        return self._real.cursor()


def test_run_sin_llm_sincroniza_y_no_genera_parrafos(db_conn):
    roadmap = Roadmap(nodes=[_nodo("a")])
    assert run(db_conn, roadmap) == 1
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM roadmap_route_blurb")
        assert cur.fetchone()[0] == 0


def test_un_llm_roto_no_tumba_la_corrida(db_conn):
    from pipeline.roadmap import Objetivo, PuntoDePartida
    roadmap = Roadmap(
        nodes=[_nodo("a")],
        objetivos=[Objetivo(slug="o", nombre="o", descripcion="", metas=["a"])],
        puntos_de_partida=[PuntoDePartida(slug="p", nombre="p", descripcion="")],
    )
    assert run(db_conn, roadmap, llm=_LLMRoto()) == 1


def test_un_error_de_base_en_blurbs_no_tumba_la_corrida(db_conn):
    roadmap = Roadmap(nodes=[_nodo("a")])
    assert run(_ConnQueRevientaEnBlurbs(db_conn), roadmap, llm=_LLMRoto()) == 1
