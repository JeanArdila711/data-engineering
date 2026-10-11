"""Spark, Kafka y Flink no publican GitHub Releases, solo tags: /releases devuelve
[] y la fuente figuraba "en verde" para siempre con 0 filas (un fallo silencioso).
El catálogo lo declara con `github_releases: false`."""

from datetime import datetime, timezone
from pathlib import Path

from pipeline.config import Catalog, Tool, load_catalog
from pipeline.db import sync_catalog, sync_sources

NOW = datetime(2026, 10, 10, tzinfo=timezone.utc)


def _catalogo() -> Catalog:
    return Catalog(tools=[
        Tool(slug="airflow", name="Apache Airflow", category="orchestration", repo="apache/airflow"),
        Tool(slug="kafka", name="Apache Kafka", category="streaming", repo="apache/kafka", github_releases=False),
    ])


def test_tool_publishes_github_releases_by_default():
    assert Tool(slug="x", name="X", category="c").github_releases is True


def test_sync_sources_skips_tools_that_only_publish_tags(db_conn):
    ids = sync_sources(db_conn, _catalogo())

    assert set(ids) == {"airflow"}
    with db_conn.cursor() as cur:
        cur.execute("SELECT tool_slug FROM sources WHERE kind = 'github_releases'")
        assert [r[0] for r in cur.fetchall()] == ["airflow"]


def test_sync_catalog_records_the_flag_on_the_current_row(db_conn):
    sync_catalog(db_conn, _catalogo(), NOW)

    with db_conn.cursor() as cur:
        cur.execute("SELECT slug, github_releases FROM dim_tool WHERE is_current ORDER BY slug")
        assert cur.fetchall() == [("airflow", True), ("kafka", False)]


def test_flag_change_does_not_open_a_new_scd2_version(db_conn):
    """Es un dato de operación, no un atributo de negocio con historia: cambiarlo
    no puede partir cada herramienta en dos versiones de la dimensión."""
    sync_catalog(db_conn, _catalogo(), NOW)
    cambiado = Catalog(tools=[
        Tool(slug="airflow", name="Apache Airflow", category="orchestration", repo="apache/airflow", github_releases=False),
        Tool(slug="kafka", name="Apache Kafka", category="streaming", repo="apache/kafka", github_releases=False),
    ])
    sync_catalog(db_conn, cambiado, NOW)

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM dim_tool")
        assert cur.fetchone()[0] == 2
        cur.execute("SELECT github_releases FROM dim_tool WHERE slug = 'airflow' AND is_current")
        assert cur.fetchone()[0] is False


def test_real_catalog_marks_spark_kafka_and_flink_as_tags_only():
    catalogo = load_catalog(Path("catalog/tools.yaml"))
    sin_releases = {t.slug for t in catalogo.tools if not t.github_releases}
    assert sin_releases == {"spark", "kafka", "flink"}
