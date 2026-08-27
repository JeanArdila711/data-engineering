-- Grano: una mención de una herramienta en un artículo. dbt no tiene un test
-- built-in de unicidad compuesta sin dbt_utils; se sigue el mismo patrón que
-- assert_no_future_releases.sql en vez de agregar una dependencia nueva.
select article_id, tool_slug, count(*)
from {{ ref('stg_article_mentions') }}
group by article_id, tool_slug
having count(*) > 1
