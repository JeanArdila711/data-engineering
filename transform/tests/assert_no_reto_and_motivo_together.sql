-- El CHECK de roadmap_challenge ya impide este estado en escritura; este
-- test verifica que sigue así en el mart, que es lo que ve la web.
select objetivo_slug
from {{ ref('mart_reto') }}
where (escenario is null) = (motivo_ausencia is null)
