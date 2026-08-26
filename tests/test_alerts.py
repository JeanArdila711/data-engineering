from datetime import datetime, timezone

NOW = datetime(2026, 8, 26, tzinfo=timezone.utc)


def test_send_source_alerts_opens_one_issue_per_degraded_source_and_marks_alerted(db_conn):
    from pipeline.alerts import send_source_alerts
    from pipeline.db import record_source_failure

    with db_conn.cursor() as cur:
        cur.execute(
            "INSERT INTO sources (tool_slug, kind, url) VALUES ('duckdb', 'rss', 'https://x') RETURNING id"
        )
        source_id = cur.fetchone()[0]
    for _ in range(3):
        record_source_failure(db_conn, source_id)

    calls = []

    def fake_opener(repo, token, title, body, labels):
        calls.append((repo, token, title, labels))

    sent = send_source_alerts(db_conn, "owner/repo", "tok", NOW, opener=fake_opener)

    assert sent == 1
    assert calls == [("owner/repo", "tok", "Fuente degradada: duckdb (rss)", ["source-health"])]

    # segunda corrida: ya no hay nada pendiente
    assert send_source_alerts(db_conn, "owner/repo", "tok", NOW, opener=fake_opener) == 0


def test_send_candidate_alerts_opens_one_issue_per_candidate_over_threshold(db_conn):
    from pipeline.alerts import send_candidate_alerts
    from pipeline.db import upsert_candidate

    upsert_candidate(db_conn, "Fooflow", "https://a.example/1", NOW)
    upsert_candidate(db_conn, "Fooflow", "https://a.example/2", NOW)

    calls = []

    def fake_opener(repo, token, title, body, labels):
        calls.append((title, labels))

    sent = send_candidate_alerts(db_conn, "owner/repo", "tok", opener=fake_opener)

    assert sent == 1
    assert calls == [("Candidato de catálogo: Fooflow", ["catalog-candidate"])]
    assert send_candidate_alerts(db_conn, "owner/repo", "tok", opener=fake_opener) == 0
