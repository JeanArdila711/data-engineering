"""El esquema del glosario debe existir con sus constraints reales."""

import psycopg
import pytest


def test_glossary_tables_exist(db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_name LIKE 'roadmap_level' "
            "OR table_name LIKE 'glossary_%'"
        )
        tables = {row[0] for row in cur.fetchall()}
    assert tables == {"roadmap_level", "glossary_term", "glossary_source", "glossary_candidates", "glossary_candidate_mentions"}


def test_glossary_term_slug_must_be_url_safe(db_conn):
    with db_conn.cursor() as cur:
        cur.execute("INSERT INTO roadmap_level (nivel, nombre) VALUES (0, 'Base')")
        with pytest.raises(psycopg.errors.CheckViolation):
            cur.execute(
                "INSERT INTO glossary_term (slug, termino, definicion, nivel) "
                "VALUES ('XCom Feo', 'x', 'y', 0)"
            )


def test_glossary_term_nivel_must_exist_in_roadmap_level(db_conn):
    with db_conn.cursor() as cur:
        with pytest.raises(psycopg.errors.ForeignKeyViolation):
            cur.execute(
                "INSERT INTO glossary_term (slug, termino, definicion, nivel) "
                "VALUES ('xcom', 'x', 'y', 99)"
            )


def test_glossary_term_uso_link_requiere_uso_texto(db_conn):
    with db_conn.cursor() as cur:
        cur.execute("INSERT INTO roadmap_level (nivel, nombre) VALUES (0, 'Base')")
        with pytest.raises(psycopg.errors.CheckViolation):
            cur.execute(
                "INSERT INTO glossary_term (slug, termino, definicion, nivel, uso_link) "
                "VALUES ('xcom', 'x', 'y', 0, 'https://x.dev')"
            )


def test_glossary_source_cascades_from_term(db_conn):
    with db_conn.cursor() as cur:
        cur.execute("INSERT INTO roadmap_level (nivel, nombre) VALUES (0, 'Base')")
        cur.execute(
            "INSERT INTO glossary_term (slug, termino, definicion, nivel) "
            "VALUES ('xcom', 'x', 'y', 0)"
        )
        cur.execute(
            "INSERT INTO glossary_source (term_slug, url, por_que) VALUES ('xcom', 'https://x.dev', 'z')"
        )
        cur.execute("DELETE FROM glossary_term WHERE slug = 'xcom'")
        cur.execute("SELECT count(*) FROM glossary_source")
        assert cur.fetchone()[0] == 0
