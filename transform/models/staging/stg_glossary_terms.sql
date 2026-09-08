select
    slug,
    termino,
    definicion,
    nivel,
    nodo_relacionado,
    uso_texto,
    uso_link
from {{ source('de_radar', 'glossary_term') }}
