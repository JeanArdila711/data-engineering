with breaking as (
    select
        release_id,
        array_agg(text order by text) as breaking_changes
    from {{ source('de_radar', 'release_changes') }}
    where kind = 'breaking'
    group by release_id
)

select
    r.release_id,
    r.tool_slug,
    t.tool_name,
    t.category,
    r.version,
    r.published_at,
    r.source_url,
    r.has_breaking,
    coalesce(b.breaking_changes, array[]::text[]) as breaking_changes
from {{ ref('stg_releases') }} as r
inner join {{ ref('stg_tools') }} as t
    on r.tool_slug = t.tool_slug
    and t.is_current
left join breaking as b
    on r.release_id = b.release_id
