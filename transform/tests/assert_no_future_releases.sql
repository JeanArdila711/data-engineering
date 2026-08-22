select * from {{ ref('mart_changelog') }} where published_at > current_timestamp
