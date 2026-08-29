select
    slug,
    tipo,
    nombre,
    resuelve,
    dominado_cuando,
    nivel,
    orden_sugerido
from {{ source('de_radar', 'roadmap_node') }}
