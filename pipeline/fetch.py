"""Cliente HTTP con clasificación explícita de errores.

Distinguir transitorio de permanente es lo que permite reintentar lo que
tiene sentido reintentar y marcar como rota la fuente que de verdad lo está.
"""

import random
import time
from collections.abc import Callable
from dataclasses import dataclass

import httpx

USER_AGENT = "de-radar/0.1 (+https://github.com/jeanardila/de-radar)"

_RETRYABLE_STATUS = {429, 500, 502, 503, 504}
_BASE_BACKOFF_SECONDS = 1.0


class TransientError(Exception):
    """Fallo reintentable: timeout, 5xx, rate limit."""


class PermanentError(Exception):
    """Fallo no reintentable: 404, 401, 403."""


@dataclass(frozen=True)
class FetchResult:
    body: str
    status: int
    url: str


def fetch(
    url: str,
    *,
    headers: dict[str, str] | None = None,
    max_attempts: int = 3,
    sleep: Callable[[float], None] = time.sleep,
    transport: httpx.BaseTransport | None = None,
    jitter: Callable[[], float] = random.random,
) -> FetchResult:
    """Trae una URL con reintentos y backoff exponencial con jitter.

    Sin jitter, varias fuentes fallando al mismo tiempo (ej. un hiccup de red
    general) reintentan sincronizadas y le pegan a los orígenes todas juntas
    otra vez. `jitter` es inyectable para que el test de crecimiento
    exponencial siga siendo determinista.
    """
    request_headers = {"User-Agent": USER_AGENT, **(headers or {})}
    last_error: Exception | None = None

    with httpx.Client(transport=transport, timeout=30.0, follow_redirects=True) as client:
        for attempt in range(max_attempts):
            try:
                response = client.get(url, headers=request_headers)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_error = exc
            else:
                if response.status_code < 400:
                    return FetchResult(body=response.text, status=response.status_code, url=url)
                if response.status_code not in _RETRYABLE_STATUS:
                    raise PermanentError(f"{url} devolvió {response.status_code}")
                last_error = TransientError(f"{url} devolvió {response.status_code}")

            if attempt < max_attempts - 1:
                sleep(_BASE_BACKOFF_SECONDS * (2**attempt) + jitter())

    raise TransientError(f"{url} falló tras {max_attempts} intentos: {last_error}")
