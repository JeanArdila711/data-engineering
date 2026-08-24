from datetime import datetime, timedelta, timezone

from pipeline.scoring import score_article

NOW = datetime(2026, 8, 22, tzinfo=timezone.utc)


def test_more_mentions_scores_higher():
    one = score_article({"duckdb"}, NOW, NOW, linked_to_release=False)
    two = score_article({"duckdb", "polars"}, NOW, NOW, linked_to_release=False)
    assert two > one


def test_more_recent_scores_higher():
    recent = score_article({"duckdb"}, NOW, NOW, linked_to_release=False)
    old = score_article({"duckdb"}, NOW - timedelta(days=6), NOW, linked_to_release=False)
    assert recent > old


def test_linked_to_release_scores_higher():
    plain = score_article({"duckdb"}, NOW, NOW, linked_to_release=False)
    linked = score_article({"duckdb"}, NOW, NOW, linked_to_release=True)
    assert linked > plain


def test_score_is_bounded_between_zero_and_one():
    assert 0.0 <= score_article({"duckdb", "polars", "spark"}, NOW, NOW, linked_to_release=True) <= 1.0
    assert 0.0 <= score_article(set(), NOW - timedelta(days=30), NOW, linked_to_release=False) <= 1.0
