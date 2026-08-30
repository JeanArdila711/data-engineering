-- Una arista que apunta a un nodo inexistente haría que el orden topológico
-- del front pierda un prerequisito en silencio.
select e.from_slug, e.to_slug
from {{ ref('stg_roadmap_edges') }} as e
left join {{ ref('stg_roadmap_nodes') }} as nf on nf.slug = e.from_slug
left join {{ ref('stg_roadmap_nodes') }} as nt on nt.slug = e.to_slug
where nf.slug is null or nt.slug is null
