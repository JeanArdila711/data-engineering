select
    from_slug,
    to_slug
from {{ source('de_radar', 'roadmap_edge') }}
