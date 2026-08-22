import httpx
import pytest

from pipeline.fetch import FetchResult, PermanentError, TransientError, fetch


def _transport(*responses: httpx.Response) -> httpx.MockTransport:
    queue = list(responses)

    def handler(request: httpx.Request) -> httpx.Response:
        return queue.pop(0)

    return httpx.MockTransport(handler)


def test_fetch_returns_body_on_success():
    transport = _transport(httpx.Response(200, text="ok"))

    result = fetch("https://example.com/feed", transport=transport)

    assert isinstance(result, FetchResult)
    assert result.body == "ok"
    assert result.status == 200


def test_fetch_retries_on_5xx_then_succeeds():
    transport = _transport(
        httpx.Response(503),
        httpx.Response(200, text="recovered"),
    )
    slept: list[float] = []

    result = fetch("https://example.com/feed", transport=transport, sleep=slept.append)

    assert result.body == "recovered"
    assert len(slept) == 1


def test_fetch_backoff_is_exponential():
    transport = _transport(
        httpx.Response(503),
        httpx.Response(503),
        httpx.Response(200, text="ok"),
    )
    slept: list[float] = []

    fetch("https://example.com/feed", transport=transport, sleep=slept.append)

    assert slept[1] > slept[0]


def test_fetch_raises_transient_after_max_attempts():
    transport = _transport(httpx.Response(503), httpx.Response(503), httpx.Response(503))

    with pytest.raises(TransientError):
        fetch("https://example.com/feed", transport=transport, max_attempts=3, sleep=lambda _: None)


def test_fetch_raises_permanent_on_404_without_retrying():
    calls: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(404)

    with pytest.raises(PermanentError):
        fetch("https://example.com/missing", transport=httpx.MockTransport(handler), sleep=lambda _: None)

    assert len(calls) == 1


def test_fetch_treats_429_as_transient():
    transport = _transport(httpx.Response(429), httpx.Response(200, text="ok"))

    result = fetch("https://example.com/feed", transport=transport, sleep=lambda _: None)

    assert result.body == "ok"


def test_fetch_sends_identifiable_user_agent():
    seen: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request.headers["user-agent"])
        return httpx.Response(200, text="ok")

    fetch("https://example.com/feed", transport=httpx.MockTransport(handler))

    assert "de-radar" in seen[0].lower()
    assert "http" in seen[0].lower()
