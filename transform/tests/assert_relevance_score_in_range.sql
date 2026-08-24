select * from {{ ref('stg_articles') }} where relevance_score < 0 or relevance_score > 1
