-- Grano: un resumen por artículo e idioma. Ya está forzado por un constraint
-- UNIQUE(article_id, idioma) en Postgres (migración 002); este test lo deja
-- documentado y verificado también a nivel dbt, no solo a nivel de esquema.
select article_id, idioma, count(*)
from {{ ref('stg_summaries') }}
group by article_id, idioma
having count(*) > 1
