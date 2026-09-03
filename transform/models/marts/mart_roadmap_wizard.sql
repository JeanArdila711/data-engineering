-- Una opción por fila con sus nodos en JSONB, para que el front haga una sola
-- query. La clausura de prerequisitos NO se calcula acá: la hace el front
-- sobre mart_roadmap, que ya trae las aristas. Calcularla en SQL duplicaría
-- la definición de qué es una ruta en dos lenguajes.

with nodos as (
    select
        kind,
        slug,
        jsonb_agg(node_slug order by node_slug) as nodos
    from {{ source('de_radar', 'roadmap_wizard_option_node') }}
    group by kind, slug
)

select
    o.kind,
    o.slug,
    o.nombre,
    o.descripcion,
    o.orden,
    coalesce(n.nodos, '[]'::jsonb) as nodos
from {{ source('de_radar', 'roadmap_wizard_option') }} as o
left join nodos as n on n.kind = o.kind and n.slug = o.slug
