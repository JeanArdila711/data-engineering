select
    nivel,
    nombre
from {{ source('de_radar', 'roadmap_level') }}
