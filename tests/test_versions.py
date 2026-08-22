import pytest

from pipeline.versions import normalize_version


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("v3.1.0", "3.1.0"),
        ("3.1.0", "3.1.0"),
        ("3.1", "3.1.0"),
        ("3", "3.0.0"),
        ("V2.10.4", "2.10.4"),
        ("release-1.2.3", "1.2.3"),
        ("  1.2.3  ", "1.2.3"),
        ("1.2.3-rc1", "1.2.3-rc1"),
        ("v1.2.3-beta.2", "1.2.3-beta.2"),
        ("airflow-2.9.1", "2.9.1"),
    ],
)
def test_normalize_version_canonicalizes(raw: str, expected: str):
    assert normalize_version(raw) == expected


@pytest.mark.parametrize("raw", ["", "   ", "nightly", "latest", "sin-numeros"])
def test_normalize_version_returns_none_when_unparseable(raw: str):
    assert normalize_version(raw) is None


def test_normalize_version_collapses_equivalent_forms():
    assert normalize_version("v3.1") == normalize_version("3.1.0")
