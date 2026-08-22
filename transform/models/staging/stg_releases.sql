select
    id as release_id,
    tool_slug,
    version,
    published_at,
    source_url,
    has_breaking,
    body,
    ingested_at
from {{ source('de_radar', 'fct_release') }}
