-- El glosario es la unión de dos fuentes (decisión de diseño del spec):
-- los 34 nodos de Rumbo proyectados con su propio `resuelve`, más los
-- términos granulares curados a mano. Grano: una fila por entrada de
-- glosario — el slug es único entre las dos fuentes (garantizado en Python
-- por pipeline/glosario.py::_validar, testeado acá como garantía de datos).

with fuentes_de_nodo as (
    select
        node_slug as slug,
        jsonb_agg(jsonb_build_object('url', url, 'por_que', por_que) order by url) as fuentes
    from {{ source('de_radar', 'roadmap_source') }}
    group by node_slug
),

fuentes_de_termino as (
    select
        term_slug as slug,
        jsonb_agg(jsonb_build_object('url', url, 'por_que', por_que) order by url) as fuentes
    from {{ source('de_radar', 'glossary_source') }}
    group by term_slug
),

desde_nodos as (
    select
        n.slug,
        n.nombre as termino,
        n.resuelve as definicion,
        n.nivel,
        l.nombre as nivel_nombre,
        n.slug as nodo_relacionado,
        x.texto as uso_texto,
        x.link as uso_link,
        coalesce(f.fuentes, '[]'::jsonb) as fuentes,
        'nodo' as origen
    from {{ ref('stg_roadmap_nodes') }} as n
    left join {{ ref('stg_roadmap_levels') }} as l on l.nivel = n.nivel
    left join {{ source('de_radar', 'roadmap_experience') }} as x on x.node_slug = n.slug
    left join fuentes_de_nodo as f on f.slug = n.slug
),

desde_terminos as (
    select
        t.slug,
        t.termino,
        t.definicion,
        t.nivel,
        l.nombre as nivel_nombre,
        t.nodo_relacionado,
        t.uso_texto,
        t.uso_link,
        coalesce(ft.fuentes, '[]'::jsonb) as fuentes,
        'termino' as origen
    from {{ ref('stg_glossary_terms') }} as t
    left join {{ ref('stg_roadmap_levels') }} as l on l.nivel = t.nivel
    left join fuentes_de_termino as ft on ft.slug = t.slug
)

select * from desde_nodos
union all
select * from desde_terminos
