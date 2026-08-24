from pipeline.dedup import content_fingerprint, normalize_url


def test_normalize_url_strips_tracking_params():
    assert normalize_url("https://x.com/p?utm_source=rss&id=1") == "https://x.com/p?id=1"


def test_normalize_url_strips_trailing_slash():
    assert normalize_url("https://x.com/p/") == normalize_url("https://x.com/p")


def test_normalize_url_lowercases_host():
    assert normalize_url("https://X.COM/p") == normalize_url("https://x.com/p")


def test_normalize_url_sorts_remaining_params():
    assert normalize_url("https://x.com/p?b=2&a=1") == normalize_url("https://x.com/p?a=1&b=2")


def test_content_fingerprint_ignores_whitespace_differences():
    assert content_fingerprint("hola   mundo") == content_fingerprint("hola\nmundo")


def test_content_fingerprint_differs_for_different_text():
    assert content_fingerprint("a") != content_fingerprint("b")
