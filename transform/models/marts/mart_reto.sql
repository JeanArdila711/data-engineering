-- Una fila por objetivo del wizard, siempre (tenga reto o motivo_ausencia).
-- El checklist se arma acá para que la web haga una sola query — mismo
-- criterio que mart_roadmap con implementaciones/fuentes.

with checklist as (
    select
        c.objetivo_slug,
        jsonb_agg(
            jsonb_build_object(
                'slug', c.node_slug,
                'nombre', n.nombre,
                'dominado_cuando', n.dominado_cuando,
                'experiencia_texto', x.texto,
                'experiencia_link', x.link
            )
            order by c.orden
        ) as checklist
    from {{ source('de_radar', 'roadmap_challenge_check') }} as c
    join {{ ref('stg_roadmap_nodes') }} as n on n.slug = c.node_slug
    left join {{ source('de_radar', 'roadmap_experience') }} as x on x.node_slug = c.node_slug
    group by c.objetivo_slug
)

select
    r.objetivo_slug,
    r.escenario,
    r.motivo_ausencia,
    coalesce(ch.checklist, '[]'::jsonb) as checklist
from {{ source('de_radar', 'roadmap_challenge') }} as r
left join checklist as ch on ch.objetivo_slug = r.objetivo_slug
