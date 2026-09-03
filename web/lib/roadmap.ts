export type RoadmapImplementation = {
  nombre: string
  tool_slug: string | null
  proveedor: 'aws' | 'gcp' | 'azure' | 'portable' | null
  equivalencia: 'alta' | 'media' | 'baja' | null
  nota: string | null
  release_count: number | null
  last_version: string | null
  last_published_at: string | null
  article_count: number | null
}

export type RoadmapSource = { url: string; por_que: string }

export type RoadmapNode = {
  slug: string
  tipo: 'concepto' | 'herramienta' | 'capacidad-cloud'
  nombre: string
  resuelve: string
  dominado_cuando: string
  nivel: number
  orden_sugerido: number
  experiencia_texto: string | null
  experiencia_link: string | null
  prerequisitos: string[]
  implementaciones: RoadmapImplementation[]
  fuentes: RoadmapSource[]
}

/**
 * Kahn con desempate estable por (nivel, orden_sugerido, slug): dos cargas
 * del mismo grafo producen el mismo orden. Si el grafo trajera un ciclo — que
 * el validador de Python ya rechaza — los nodos restantes se agregan al final
 * en vez de desaparecer: mostrar la ruta incompleta en silencio sería peor.
 */
export function ordenarTopologico(nodes: RoadmapNode[]): RoadmapNode[] {
  const porSlug = new Map(nodes.map(n => [n.slug, n]))
  const pendientes = new Map(
    nodes.map(n => [n.slug, n.prerequisitos.filter(p => porSlug.has(p)).length]),
  )
  const dependientes = new Map<string, string[]>()
  for (const n of nodes) {
    for (const p of n.prerequisitos) {
      if (!porSlug.has(p)) continue
      dependientes.set(p, [...(dependientes.get(p) ?? []), n.slug])
    }
  }

  const comparar = (a: string, b: string) => {
    const x = porSlug.get(a)!, y = porSlug.get(b)!
    return x.nivel - y.nivel || x.orden_sugerido - y.orden_sugerido || a.localeCompare(b)
  }

  const listos = nodes.filter(n => pendientes.get(n.slug) === 0).map(n => n.slug).sort(comparar)
  const orden: RoadmapNode[] = []

  while (listos.length > 0) {
    const slug = listos.shift()!
    orden.push(porSlug.get(slug)!)
    for (const hijo of dependientes.get(slug) ?? []) {
      const restantes = pendientes.get(hijo)! - 1
      pendientes.set(hijo, restantes)
      if (restantes === 0) {
        listos.push(hijo)
        listos.sort(comparar)
      }
    }
  }

  const vistos = new Set(orden.map(n => n.slug))
  return [...orden, ...nodes.filter(n => !vistos.has(n.slug)).sort((a, b) => comparar(a.slug, b.slug))]
}

export function agruparPorNivel(nodes: RoadmapNode[]): { nivel: number; nodes: RoadmapNode[] }[] {
  const grupos = new Map<number, RoadmapNode[]>()
  for (const n of ordenarTopologico(nodes)) {
    grupos.set(n.nivel, [...(grupos.get(n.nivel) ?? []), n])
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a - b)
    .map(([nivel, nodes]) => ({ nivel, nodes }))
}

export type WizardOption = {
  kind: 'objetivo' | 'partida'
  slug: string
  nombre: string
  descripcion: string
  orden: number
  nodos: string[]
}

/**
 * Las semillas más todos sus prerequisitos, transitivamente. Ignora slugs
 * que no están en el grafo. Misma función que pipeline/roadmap.py::
 * clausura_prerequisitos — si cambia una, cambia la otra.
 */
export function clausuraPrerequisitos(nodes: RoadmapNode[], semillas: Iterable<string>): Set<string> {
  const prereqs = new Map(nodes.map(n => [n.slug, n.prerequisitos]))
  const vistos = new Set<string>()
  const pila = [...semillas].filter(s => prereqs.has(s))
  while (pila.length > 0) {
    const slug = pila.pop()!
    if (vistos.has(slug)) continue
    vistos.add(slug)
    pila.push(...(prereqs.get(slug) ?? []).filter(p => prereqs.has(p)))
  }
  return vistos
}

/**
 * La ruta es una consulta sobre el grafo (decisión 3): clausura de las metas
 * menos clausura de lo conocido. `sabidos` son los nodos de la ruta que se
 * dieron por sabidos, para poder mostrarlos: la ruta explica lo que quita.
 */
export function subgrafo(
  nodes: RoadmapNode[],
  metas: string[],
  conocidos: string[],
): { ruta: RoadmapNode[]; sabidos: RoadmapNode[] } {
  const objetivo = clausuraPrerequisitos(nodes, metas)
  const conocido = clausuraPrerequisitos(nodes, conocidos)
  const dentro = nodes.filter(n => objetivo.has(n.slug))
  return {
    ruta: ordenarTopologico(dentro.filter(n => !conocido.has(n.slug))),
    sabidos: ordenarTopologico(dentro.filter(n => conocido.has(n.slug))),
  }
}

/** Para cada nodo, los nombres de las metas para las que es necesario. */
export function metasAlcanzadas(nodes: RoadmapNode[], metas: string[]): Map<string, string[]> {
  const nombre = new Map(nodes.map(n => [n.slug, n.nombre]))
  const porQue = new Map<string, string[]>()
  for (const meta of [...metas].sort()) {
    for (const slug of clausuraPrerequisitos(nodes, [meta])) {
      porQue.set(slug, [...(porQue.get(slug) ?? []), nombre.get(meta) ?? meta])
    }
  }
  return porQue
}
