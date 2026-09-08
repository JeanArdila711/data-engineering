"""sync_glosario borra y reescribe: el glosario no lleva historial (git ya
lo tiene). sync_roadmap gana la sincronización de roadmap_level."""

from pipeline.db import sync_glosario, sync_roadmap
from pipeline.glosario import Glosario, GlossarySource, GlossaryTerm
from pipeline.roadmap import Roadmap, RoadmapNode


def _roadmap_con_niveles(niveles: dict[int, str]) -> Roadmap:
    return Roadmap(
        nodes=[RoadmapNode(
            slug="sql", tipo="herramienta", nombre="SQL",
            resuelve="x", dominado_cuando="y", nivel=0,
        )],
        niveles=niveles,
    )


def _termino(slug: str, **extra) -> GlossaryTerm:
    base = dict(
        slug=slug, termino=slug.upper(), definicion="algo", nivel=0,
        fuentes=[GlossarySource(url="https://x.dev", por_que="oficial")],
    )
    base.update(extra)
    return GlossaryTerm(**base)


def test_sync_roadmap_inserta_niveles(db_conn):
    sync_roadmap(db_conn, _roadmap_con_niveles({0: "Base", 1: "Modelo mental"}))
    with db_conn.cursor() as cur:
        cur.execute("SELECT nivel, nombre FROM roadmap_level ORDER BY nivel")
        assert cur.fetchall() == [(0, "Base"), (1, "Modelo mental")]


def test_sync_roadmap_niveles_es_idempotente(db_conn):
    roadmap = _roadmap_con_niveles({0: "Base"})
    sync_roadmap(db_conn, roadmap)
    sync_roadmap(db_conn, roadmap)
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM roadmap_level")
        assert cur.fetchone()[0] == 1


def test_sync_roadmap_borra_niveles_que_salieron_del_yaml(db_conn):
    sync_roadmap(db_conn, _roadmap_con_niveles({0: "Base", 9: "Viejo"}))
    sync_roadmap(db_conn, _roadmap_con_niveles({0: "Base"}))
    with db_conn.cursor() as cur:
        cur.execute("SELECT nivel FROM roadmap_level")
        assert cur.fetchall() == [(0,)]


def test_sync_glosario_inserta_termino_y_fuente(db_conn):
    sync_roadmap(db_conn, _roadmap_con_niveles({0: "Base"}))
    sync_glosario(db_conn, Glosario(terminos=[_termino("xcom")]))
    with db_conn.cursor() as cur:
        cur.execute("SELECT slug FROM glossary_term")
        assert cur.fetchall() == [("xcom",)]
        cur.execute("SELECT term_slug, url FROM glossary_source")
        assert cur.fetchall() == [("xcom", "https://x.dev")]


def test_sync_glosario_es_idempotente(db_conn):
    sync_roadmap(db_conn, _roadmap_con_niveles({0: "Base"}))
    glosario = Glosario(terminos=[_termino("xcom")])
    sync_glosario(db_conn, glosario)
    sync_glosario(db_conn, glosario)
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM glossary_term")
        assert cur.fetchone()[0] == 1
        cur.execute("SELECT count(*) FROM glossary_source")
        assert cur.fetchone()[0] == 1


def test_sync_glosario_borra_terminos_que_salieron_del_yaml(db_conn):
    sync_roadmap(db_conn, _roadmap_con_niveles({0: "Base"}))
    sync_glosario(db_conn, Glosario(terminos=[_termino("xcom"), _termino("viejo")]))
    sync_glosario(db_conn, Glosario(terminos=[_termino("xcom")]))
    with db_conn.cursor() as cur:
        cur.execute("SELECT slug FROM glossary_term")
        assert cur.fetchall() == [("xcom",)]


def test_sync_glosario_actualiza_definicion_existente(db_conn):
    sync_roadmap(db_conn, _roadmap_con_niveles({0: "Base"}))
    sync_glosario(db_conn, Glosario(terminos=[_termino("xcom", definicion="vieja")]))
    sync_glosario(db_conn, Glosario(terminos=[_termino("xcom", definicion="nueva")]))
    with db_conn.cursor() as cur:
        cur.execute("SELECT definicion FROM glossary_term WHERE slug = 'xcom'")
        assert cur.fetchone()[0] == "nueva"


def test_sync_glosario_con_lista_vacia_no_revienta(db_conn):
    """El ::text[] explícito importa: una lista vacía sin él no infiere tipo."""
    sync_roadmap(db_conn, _roadmap_con_niveles({0: "Base"}))
    sync_glosario(db_conn, Glosario(terminos=[]))
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM glossary_term")
        assert cur.fetchone()[0] == 0
