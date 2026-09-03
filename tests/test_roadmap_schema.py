"""El esquema del grafo debe existir con sus constraints reales.

Se testea el constraint, no el DDL: la garantía de idempotencia del grafo
vive en la base, no en la disciplina del código que la llama.
"""

import psycopg
import pytest


def test_roadmap_tables_exist(db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_name LIKE 'roadmap_%'"
        )
        tables = {row[0] for row in cur.fetchall()}

    assert tables == {
        "roadmap_node",
        "roadmap_edge",
        "roadmap_experience",
        "roadmap_source",
        "roadmap_implementation",
        "roadmap_wizard_option",
        "roadmap_wizard_option_node",
    }


def test_edge_is_unique_per_pair(db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            "INSERT INTO roadmap_node (slug, tipo, nombre, resuelve, dominado_cuando, nivel) "
            "VALUES ('a', 'concepto', 'A', 'x', 'y', 0), ('b', 'concepto', 'B', 'x', 'y', 1)"
        )
        cur.execute("INSERT INTO roadmap_edge (from_slug, to_slug) VALUES ('a', 'b')")
        with pytest.raises(psycopg.errors.UniqueViolation):
            cur.execute("INSERT INTO roadmap_edge (from_slug, to_slug) VALUES ('a', 'b')")


def test_experience_is_unique_per_node(db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            "INSERT INTO roadmap_node (slug, tipo, nombre, resuelve, dominado_cuando, nivel) "
            "VALUES ('a', 'concepto', 'A', 'x', 'y', 0)"
        )
        cur.execute("INSERT INTO roadmap_experience (node_slug, texto, link) VALUES ('a', 't', NULL)")
        with pytest.raises(psycopg.errors.UniqueViolation):
            cur.execute("INSERT INTO roadmap_experience (node_slug, texto, link) VALUES ('a', 'z', NULL)")


def test_tipo_is_constrained(db_conn):
    with db_conn.cursor() as cur:
        with pytest.raises(psycopg.errors.CheckViolation):
            cur.execute(
                "INSERT INTO roadmap_node (slug, tipo, nombre, resuelve, dominado_cuando, nivel) "
                "VALUES ('a', 'inventado', 'A', 'x', 'y', 0)"
            )


def test_wizard_tables_exist(db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_name LIKE 'roadmap_wizard%'"
        )
        assert {row[0] for row in cur.fetchall()} == {
            "roadmap_wizard_option",
            "roadmap_wizard_option_node",
        }


def test_wizard_kind_is_constrained(db_conn):
    with db_conn.cursor() as cur:
        with pytest.raises(psycopg.errors.CheckViolation):
            cur.execute(
                "INSERT INTO roadmap_wizard_option (kind, slug, nombre, descripcion, orden) "
                "VALUES ('pregunta', 'x', 'X', 'd', 0)"
            )


def test_wizard_slug_must_be_url_safe(db_conn):
    """El slug es un segmento de URL: si acá entra un espacio o una mayúscula,
    la página devuelve 404 y nadie sabe por qué."""
    with db_conn.cursor() as cur:
        with pytest.raises(psycopg.errors.CheckViolation):
            cur.execute(
                "INSERT INTO roadmap_wizard_option (kind, slug, nombre, descripcion, orden) "
                "VALUES ('objetivo', 'Pipelines Batch', 'X', 'd', 0)"
            )


def test_wizard_option_node_cascades_from_option(db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            "INSERT INTO roadmap_node (slug, tipo, nombre, resuelve, dominado_cuando, nivel) "
            "VALUES ('a', 'concepto', 'A', 'x', 'y', 0)"
        )
        cur.execute(
            "INSERT INTO roadmap_wizard_option (kind, slug, nombre, descripcion, orden) "
            "VALUES ('objetivo', 'o', 'O', 'd', 0)"
        )
        cur.execute(
            "INSERT INTO roadmap_wizard_option_node (kind, slug, node_slug) VALUES ('objetivo', 'o', 'a')"
        )
        cur.execute("DELETE FROM roadmap_wizard_option WHERE slug = 'o'")
        cur.execute("SELECT count(*) FROM roadmap_wizard_option_node")
        assert cur.fetchone()[0] == 0
