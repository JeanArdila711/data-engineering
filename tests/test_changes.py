from pipeline.changes import ExtractedChange, extract_changes, has_breaking_changes

BODY_WITH_SECTIONS = """
## What's Changed

### Breaking Changes
* Removed deprecated `run_as_user` parameter
* Minimum Python version is now 3.10

### Features
* Added support for dynamic task mapping

### Bug Fixes
* Fixed a race condition in the scheduler
"""


def test_extract_changes_reads_breaking_section():
    changes = extract_changes(BODY_WITH_SECTIONS)
    breaking = [c for c in changes if c.kind == "breaking"]

    assert len(breaking) == 2
    assert "run_as_user" in breaking[0].text


def test_extract_changes_reads_all_sections():
    changes = extract_changes(BODY_WITH_SECTIONS)
    kinds = {c.kind for c in changes}

    assert kinds == {"breaking", "feature", "fix"}


def test_extract_changes_preserves_original_text():
    changes = extract_changes(BODY_WITH_SECTIONS)
    assert any(c.text == "Minimum Python version is now 3.10" for c in changes)


def test_extract_changes_returns_empty_when_no_known_sections():
    assert extract_changes("Just a plain release note with no structure.") == []


def test_extract_changes_handles_empty_body():
    assert extract_changes("") == []


def test_has_breaking_changes_true_when_section_present():
    assert has_breaking_changes(BODY_WITH_SECTIONS) is True


def test_has_breaking_changes_false_without_section():
    assert has_breaking_changes("### Features\n* Something new") is False


def test_has_breaking_changes_detects_bang_convention():
    assert has_breaking_changes("feat!: drop support for Python 3.8") is True


def test_extract_changes_ignores_case_in_headers():
    body = "## BREAKING CHANGES\n* Removed the old API"
    changes = extract_changes(body)
    assert changes == [ExtractedChange(kind="breaking", text="Removed the old API")]
