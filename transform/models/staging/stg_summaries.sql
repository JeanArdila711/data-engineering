select
    article_id,
    idioma,
    text
from {{ source('de_radar', 'summaries') }}
