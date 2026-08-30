-- Un nodo por fila, con sus hijos agregados en JSONB para que el front haga
-- una sola query. La capa de datos vivos se joinea por tool_slug: un nodo sin
-- herramienta catalogada simplemente no la trae.

with prerequisitos as (
    select
        to_slug as slug,
        jsonb_agg(from_slug order by from_slug) as prerequisitos
    from {{ ref('stg_roadmap_edges') }}
    group by to_slug
),

implementaciones as (
    select
        i.node_slug as slug,
        jsonb_agg(
            jsonb_build_object(
                'nombre', i.nombre,
                'tool_slug', i.tool_slug,
                'proveedor', i.proveedor,
                'equivalencia', i.equivalencia,
                'nota', i.nota,
                'release_count', e.release_count,
                'last_version', e.last_version,
                'last_published_at', e.last_published_at,
                'article_count', e.article_count
            )
            order by i.nombre
        ) as implementaciones
    from {{ source('de_radar', 'roadmap_implementation') }} as i
    left join {{ ref('mart_ecosystem') }} as e on e.tool_slug = i.tool_slug
    group by i.node_slug
),

fuentes as (
    select
        node_slug as slug,
        jsonb_agg(jsonb_build_object('url', url, 'por_que', por_que) order by url) as fuentes
    from {{ source('de_radar', 'roadmap_source') }}
    group by node_slug
)

select
    n.slug,
    n.tipo,
    n.nombre,
    n.resuelve,
    n.dominado_cuando,
    n.nivel,
    n.orden_sugerido,
    x.texto as experiencia_texto,
    x.link as experiencia_link,
    coalesce(p.prerequisitos, '[]'::jsonb) as prerequisitos,
    coalesce(i.implementaciones, '[]'::jsonb) as implementaciones,
    coalesce(f.fuentes, '[]'::jsonb) as fuentes
from {{ ref('stg_roadmap_nodes') }} as n
left join {{ source('de_radar', 'roadmap_experience') }} as x on x.node_slug = n.slug
left join prerequisitos as p on p.slug = n.slug
left join implementaciones as i on i.slug = n.slug
left join fuentes as f on f.slug = n.slug
