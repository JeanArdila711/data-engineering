with release_stats as (
    select
        tool_slug,
        count(*) as release_count,
        count(*) filter (where has_breaking) as breaking_release_count
    from {{ ref('stg_releases') }}
    group by tool_slug
),

last_release as (
    select distinct on (tool_slug)
        tool_slug,
        version as last_version,
        published_at as last_published_at,
        has_breaking as last_has_breaking
    from {{ ref('stg_releases') }}
    order by tool_slug, published_at desc
),

recent_releases as (
    select
        tool_slug,
        jsonb_agg(
            jsonb_build_object(
                'version', version,
                'published_at', published_at,
                'has_breaking', has_breaking,
                'source_url', source_url
            )
            order by published_at desc
        ) as release_history
    from (
        select
            tool_slug, version, published_at, has_breaking, source_url,
            row_number() over (partition by tool_slug order by published_at desc) as rn
        from {{ ref('stg_releases') }}
    ) as ranked
    where rn <= 10
    group by tool_slug
),

article_stats as (
    select
        tool_slug,
        count(distinct article_id) as article_count
    from {{ ref('stg_article_mentions') }}
    group by tool_slug
)

select
    t.tool_slug,
    t.tool_name,
    t.category,
    t.vendor,
    t.repo,
    t.homepage,
    t.effective_from as tracked_since,
    coalesce(rs.release_count, 0) as release_count,
    coalesce(rs.breaking_release_count, 0) as breaking_release_count,
    lr.last_version,
    lr.last_published_at,
    lr.last_has_breaking,
    coalesce(rr.release_history, '[]'::jsonb) as release_history,
    coalesce(ast.article_count, 0) as article_count
from {{ ref('stg_tools') }} as t
left join release_stats as rs on t.tool_slug = rs.tool_slug
left join last_release as lr on t.tool_slug = lr.tool_slug
left join recent_releases as rr on t.tool_slug = rr.tool_slug
left join article_stats as ast on t.tool_slug = ast.tool_slug
where t.is_current
