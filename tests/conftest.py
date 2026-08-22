import os
from pathlib import Path

import psycopg
import pytest
from dotenv import load_dotenv

load_dotenv()


@pytest.fixture
def db_conn():
    dsn = os.environ.get("TEST_DATABASE_URL")
    if not dsn:
        pytest.skip("TEST_DATABASE_URL no configurada")

    conn = psycopg.connect(dsn, autocommit=True)
    with conn.cursor() as cur:
        cur.execute("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;")

    from pipeline.db import apply_migrations

    apply_migrations(conn, Path("migrations"))
    yield conn
    conn.close()
