from datetime import datetime, timedelta, timezone

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


def test_send_glossary_candidate_alerts_opens_one_issue_per_candidate_over_threshold(db_conn):
    from pipeline.alerts import send_glossary_candidate_alerts
    from pipeline.db import upsert_glossary_candidate

    upsert_glossary_candidate(db_conn, "circuit breaker", "https://a.example/1", NOW)
    upsert_glossary_candidate(db_conn, "circuit breaker", "https://a.example/2", NOW)

    calls = []

    def fake_opener(repo, token, title, body, labels):
        calls.append((title, labels))

    sent = send_glossary_candidate_alerts(db_conn, "owner/repo", "tok", opener=fake_opener)

    assert sent == 1
    assert calls == [("Candidato de glosario: circuit breaker", ["glossary-candidate"])]
    assert send_glossary_candidate_alerts(db_conn, "owner/repo", "tok", opener=fake_opener) == 0


# ---- Tasa de rechazo por anclaje ----

def _attempts(conn, rejected: int, accepted: int, at: datetime) -> None:
    """Siembra intentos de resumen: cada rechazo es una fila de cuarentena en
    `anchor`; cada aceptado, un artículo con resumen EN."""
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO sources (tool_slug, kind, url) VALUES ('duckdb', 'rss', 'https://x') "
            "ON CONFLICT (tool_slug, kind, url) DO UPDATE SET url = EXCLUDED.url RETURNING id"
        )
        source_id = cur.fetchone()[0]
        for _ in range(rejected):
            cur.execute(
                "INSERT INTO quarantine (source_ref, stage, error, occurred_at) VALUES ('article:0', 'anchor', 'x', %s)",
                (at,),
            )
        for i in range(accepted):
            cur.execute(
                "INSERT INTO articles (feed_source_id, url, url_normalized, title, published_at, summary_text, "
                "content_hash, relevance_score) VALUES (%s, %s, %s, 't', %s, 's', 'h', 1) RETURNING id",
                (source_id, f"https://a/{at.isoformat()}/{i}", f"https://a/{at.isoformat()}/{i}", at),
            )
            article_id = cur.fetchone()[0]
            cur.execute(
                "INSERT INTO summaries (article_id, idioma, text, generated_at) VALUES (%s, 'en', 't', %s)",
                (article_id, at),
            )


def _collect():
    calls = []

    def opener(repo, token, title, body, labels):
        calls.append((title, labels))

    return calls, opener


def test_anchor_alert_opens_an_issue_when_the_rejection_rate_is_high(db_conn):
    from pipeline.alerts import send_anchor_rejection_alert

    _attempts(db_conn, rejected=6, accepted=6, at=NOW - timedelta(days=1))
    calls, opener = _collect()

    assert send_anchor_rejection_alert(db_conn, "o/r", "tok", NOW, opener=opener) == 1
    assert len(calls) == 1 and calls[0][1] == ["anchor-rejection"]
    assert "50%" in calls[0][0]


def test_anchor_alert_stays_quiet_with_too_few_attempts(db_conn):
    from pipeline.alerts import send_anchor_rejection_alert

    _attempts(db_conn, rejected=7, accepted=0, at=NOW - timedelta(days=1))
    calls, opener = _collect()

    assert send_anchor_rejection_alert(db_conn, "o/r", "tok", NOW, opener=opener) == 0
    assert calls == []


def test_anchor_alert_stays_quiet_when_the_rate_is_acceptable(db_conn):
    from pipeline.alerts import send_anchor_rejection_alert

    _attempts(db_conn, rejected=1, accepted=11, at=NOW - timedelta(days=1))
    calls, opener = _collect()

    assert send_anchor_rejection_alert(db_conn, "o/r", "tok", NOW, opener=opener) == 0


def test_anchor_alert_ignores_attempts_outside_the_window(db_conn):
    from pipeline.alerts import send_anchor_rejection_alert

    _attempts(db_conn, rejected=10, accepted=0, at=NOW - timedelta(days=30))
    _attempts(db_conn, rejected=0, accepted=12, at=NOW - timedelta(days=1))
    calls, opener = _collect()

    assert send_anchor_rejection_alert(db_conn, "o/r", "tok", NOW, opener=opener) == 0


def test_anchor_alert_does_not_repeat_inside_the_window_and_repeats_after_it(db_conn):
    from pipeline.alerts import send_anchor_rejection_alert

    _attempts(db_conn, rejected=6, accepted=6, at=NOW - timedelta(days=1))
    calls, opener = _collect()

    assert send_anchor_rejection_alert(db_conn, "o/r", "tok", NOW, opener=opener) == 1
    assert send_anchor_rejection_alert(db_conn, "o/r", "tok", NOW + timedelta(days=2), opener=opener) == 0
    # 15 días después los intentos viejos salieron de la ventana: sembrar nuevos.
    later = NOW + timedelta(days=15)
    _attempts(db_conn, rejected=6, accepted=6, at=later - timedelta(days=1))
    assert send_anchor_rejection_alert(db_conn, "o/r", "tok", later, opener=opener) == 1


def test_anchor_alert_is_retried_next_run_if_opening_the_issue_fails(db_conn):
    import pytest

    from pipeline.alerts import send_anchor_rejection_alert

    _attempts(db_conn, rejected=6, accepted=6, at=NOW - timedelta(days=1))

    def broken_opener(repo, token, title, body, labels):
        raise RuntimeError("github caído")

    with pytest.raises(RuntimeError):
        send_anchor_rejection_alert(db_conn, "o/r", "tok", NOW, opener=broken_opener)

    calls, opener = _collect()
    assert send_anchor_rejection_alert(db_conn, "o/r", "tok", NOW, opener=opener) == 1
