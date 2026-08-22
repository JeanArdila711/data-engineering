select
    tool_key,
    slug as tool_slug,
    name as tool_name,
    category,
    vendor,
    repo,
    homepage,
    effective_from,
    effective_to,
    is_current
from {{ source('de_radar', 'dim_tool') }}
