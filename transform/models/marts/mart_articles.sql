with mentions as (
    select
        m.article_id,
        array_agg(distinct t.tool_name order by t.tool_name) as tool_names,
        array_agg(distinct m.tool_slug order by m.tool_slug) as tool_slugs
    from {{ ref('stg_article_mentions') }} as m
    inner join {{ ref('stg_tools') }} as t
        on m.tool_slug = t.tool_slug
        and t.is_current
    group by m.article_id
),

summary_en as (
    select article_id, text as summary_en from {{ ref('stg_summaries') }} where idioma = 'en'
),

summary_es as (
    select article_id, text as summary_es from {{ ref('stg_summaries') }} where idioma = 'es'
)

select
    a.article_id,
    a.url,
    a.title,
    a.author,
    a.published_at,
    a.relevance_score,
    m.tool_names,
    m.tool_slugs,
    se.summary_en,
    ses.summary_es
from {{ ref('stg_articles') }} as a
inner join mentions as m on a.article_id = m.article_id
left join summary_en as se on a.article_id = se.article_id
left join summary_es as ses on a.article_id = ses.article_id
