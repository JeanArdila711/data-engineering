with recent_releases as (
    select
        tool_slug,
        count(*) as release_count_7d,
        count(*) filter (where has_breaking) as breaking_count_7d,
        jsonb_agg(
            jsonb_build_object(
                'version', version,
                'published_at', published_at,
                'has_breaking', has_breaking,
                'source_url', source_url
            )
            order by published_at desc
        ) as releases_7d
    from {{ ref('stg_releases') }}
    where published_at > current_timestamp - interval '7 days'
    group by tool_slug
),

recent_articles as (
    select
        m.tool_slug,
        count(distinct a.article_id) as article_count_7d,
        jsonb_agg(
            jsonb_build_object(
                'article_id', a.article_id,
                'title', a.title,
                'url', a.url,
                'summary_en', s_en.text,
                'summary_es', s_es.text
            )
        ) filter (where s_en.text is not null) as top_articles_7d
    from {{ ref('stg_article_mentions') }} as m
    inner join {{ ref('stg_articles') }} as a on m.article_id = a.article_id
    left join {{ ref('stg_summaries') }} as s_en
        on a.article_id = s_en.article_id and s_en.idioma = 'en'
    left join {{ ref('stg_summaries') }} as s_es
        on a.article_id = s_es.article_id and s_es.idioma = 'es'
    where a.published_at > current_timestamp - interval '7 days'
    group by m.tool_slug
)

select
    t.tool_slug,
    t.tool_name,
    t.category,
    coalesce(rr.release_count_7d, 0) as release_count_7d,
    coalesce(rr.breaking_count_7d, 0) as breaking_count_7d,
    coalesce(rr.releases_7d, '[]'::jsonb) as releases_7d,
    coalesce(ra.article_count_7d, 0) as article_count_7d,
    coalesce(ra.top_articles_7d, '[]'::jsonb) as top_articles_7d
from {{ ref('stg_tools') }} as t
left join recent_releases as rr on t.tool_slug = rr.tool_slug
left join recent_articles as ra on t.tool_slug = ra.tool_slug
where t.is_current
  and (coalesce(rr.release_count_7d, 0) > 0 or coalesce(ra.article_count_7d, 0) > 0)
order by (coalesce(rr.release_count_7d, 0) + coalesce(ra.article_count_7d, 0)) desc
