-- version normalizado (ej. "483.0.0") solo sirve para la clave de dedup en
-- fct_release; nada aguas abajo lo necesita en esa forma. Se expone el tag
-- crudo (raw_version) sin el "v" de prefijo, que es lo que el usuario debe
-- ver — Trino no usa semver y forzarlo a MAJOR.MINOR.PATCH miente.
select
    id as release_id,
    tool_slug,
    regexp_replace(raw_version, '^[vV]', '') as version,
    published_at,
    source_url,
    has_breaking,
    body,
    ingested_at
from {{ source('de_radar', 'fct_release') }}
