"""Normalización de versiones a semver canónico.

Las fuentes escriben la misma versión de muchas formas. Sin esta
normalización, la clave natural (herramienta, versión) no deduplica nada.
"""

import re

_VERSION_RE = re.compile(
    r"(?P<major>\d+)"
    r"(?:\.(?P<minor>\d+))?"
    r"(?:\.(?P<patch>\d+))?"
    r"(?:[-+](?P<pre>[0-9A-Za-z][0-9A-Za-z.-]*))?"
)


def normalize_version(raw: str) -> str | None:
    """Devuelve la versión como MAJOR.MINOR.PATCH[-PRERELEASE], o None."""
    if not raw or not raw.strip():
        return None

    match = _VERSION_RE.search(raw.strip())
    if not match:
        return None

    major = match.group("major")
    minor = match.group("minor") or "0"
    patch = match.group("patch") or "0"
    pre = match.group("pre")

    version = f"{major}.{minor}.{patch}"
    return f"{version}-{pre}" if pre else version
