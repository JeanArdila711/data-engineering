select
    id as article_id,
    url,
    url_normalized,
    title,
    author,
    published_at,
    relevance_score,
    ingested_at
from {{ source('de_radar', 'articles') }}
