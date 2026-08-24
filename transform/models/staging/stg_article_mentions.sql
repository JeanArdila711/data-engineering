select
    article_id,
    tool_slug
from {{ source('de_radar', 'fct_article_mention') }}
