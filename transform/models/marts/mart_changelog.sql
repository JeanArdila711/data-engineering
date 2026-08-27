with breaking as (
    select
        release_id,
        array_agg(text order by text) as breaking_changes
    from {{ source('de_radar', 'release_changes') }}
    where kind = 'breaking'
    group by release_id
),

-- effective_from marca cuándo el pipeline empezó a rastrear esa versión del
-- dim, no cuándo la herramienta realmente tuvo ese atributo — un release
-- traído por el backfill paginado puede ser más viejo que el primer
-- effective_from que existe. version_rank ubica cuál fila de dim_tool es la
-- más vieja conocida por herramienta, para no perder esos releases del join.
tool_versions as (
    select
        tool_slug,
        tool_name,
        category,
        effective_from,
        coalesce(effective_to, 'infinity'::timestamptz) as effective_to,
        row_number() over (partition by tool_slug order by effective_from asc) as version_rank
    from {{ ref('stg_tools') }}
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
-- Resuelve qué versión de dim_tool estaba vigente cuando salió ESTE release,
-- no la de hoy — de lo contrario un cambio de categoría reescribe el
-- historial completo del changelog retroactivamente.
inner join tool_versions as t
    on r.tool_slug = t.tool_slug
    and r.published_at < t.effective_to
    and (r.published_at >= t.effective_from or t.version_rank = 1)
left join breaking as b
    on r.release_id = b.release_id
