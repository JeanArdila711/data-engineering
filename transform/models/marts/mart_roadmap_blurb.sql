-- El párrafo "por qué este orden" de cada ruta personalizada. Una fila por
-- (objetivo, partida) que tenga párrafo vigente; las que no, no aparecen y
-- la página muestra la ruta sin párrafo.

select
    objetivo,
    partida,
    texto,
    generated_at
from {{ source('de_radar', 'roadmap_route_blurb') }}
