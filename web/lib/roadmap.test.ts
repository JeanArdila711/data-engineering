import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ordenarTopologico, agruparPorNivel, clausuraPrerequisitos, subgrafo, metasAlcanzadas, parsearSlugs, parsearProveedor, frontera, aplicarSabidos, priorizarProveedor, tieneNubes, type RoadmapNode, type RoadmapImplementation } from './roadmap.ts'

const nodo = (slug: string, prerequisitos: string[] = [], nivel = 0): RoadmapNode => ({
  slug, tipo: 'concepto', nombre: slug, resuelve: '', dominado_cuando: '',
  nivel, orden_sugerido: 0, experiencia_texto: null, experiencia_link: null,
  prerequisitos, implementaciones: [], fuentes: [],
})

test('pone los prerequisitos antes que sus dependientes', () => {
  const orden = ordenarTopologico([nodo('c', ['b']), nodo('a'), nodo('b', ['a'])])
  assert.deepEqual(orden.map(n => n.slug), ['a', 'b', 'c'])
})

test('es determinista con empates', () => {
  const entrada = [nodo('b'), nodo('a')]
  assert.deepEqual(
    ordenarTopologico(entrada).map(n => n.slug),
    ordenarTopologico([...entrada].reverse()).map(n => n.slug),
  )
})

test('no pierde nodos si el grafo trae un ciclo', () => {
  const orden = ordenarTopologico([nodo('a', ['b']), nodo('b', ['a'])])
  assert.equal(orden.length, 2)
})

test('agrupa por nivel en orden ascendente', () => {
  const grupos = agruparPorNivel([nodo('b', [], 2), nodo('a', [], 0)])
  assert.deepEqual(grupos.map(g => g.nivel), [0, 2])
})

// a <- b <- c ; d suelto ; e <- f
const GRAFO = [
  nodo('a'), nodo('b', ['a'], 1), nodo('c', ['b'], 2), nodo('d'), nodo('e'), nodo('f', ['e'], 1),
]

test('la clausura trae los prerequisitos transitivos y nada más', () => {
  assert.deepEqual([...clausuraPrerequisitos(GRAFO, ['c'])].sort(), ['a', 'b', 'c'])
})

test('la clausura ignora slugs que no están en el grafo', () => {
  assert.deepEqual([...clausuraPrerequisitos(GRAFO, ['zzz'])], [])
})

test('el subgrafo es la clausura de las metas menos la clausura de lo conocido', () => {
  const { ruta, sabidos } = subgrafo(GRAFO, ['c', 'f'], ['b'])
  assert.deepEqual(ruta.map(n => n.slug), ['e', 'f', 'c'])
  assert.deepEqual(sabidos.map(n => n.slug), ['a', 'b'])
})

test('saber un nodo implica saber sus prerequisitos', () => {
  const { ruta } = subgrafo(GRAFO, ['c'], ['c'])
  assert.deepEqual(ruta, [])
})

test('mismas respuestas, misma ruta, sin importar el orden de entrada', () => {
  const a = subgrafo(GRAFO, ['f', 'c'], ['b']).ruta.map(n => n.slug)
  const b = subgrafo([...GRAFO].reverse(), ['c', 'f'], ['b']).ruta.map(n => n.slug)
  assert.deepEqual(a, b)
})

test('un nodo suelto solo entra si es meta', () => {
  assert.equal(subgrafo(GRAFO, ['c'], []).ruta.some(n => n.slug === 'd'), false)
  assert.equal(subgrafo(GRAFO, ['c', 'd'], []).ruta.some(n => n.slug === 'd'), true)
})

test('la clausura no truena con un prerequisito huérfano (slug inexistente en el grafo)', () => {
  const conHuerfano = [nodo('a', ['zzz'])]
  assert.deepEqual([...clausuraPrerequisitos(conHuerfano, ['a'])].sort(), ['a'])
})

test('metasAlcanzadas dice para qué metas hace falta cada nodo', () => {
  const porQue = metasAlcanzadas(GRAFO, ['c', 'f'])
  assert.deepEqual(porQue.get('a'), ['c'])
  assert.deepEqual(porQue.get('c'), ['c'])
  assert.deepEqual(porQue.get('e'), ['f'])
  assert.equal(porQue.has('d'), false)
})

// --- Fase 3 ---

test('parsearSlugs descarta lo que no está en la ruta, deduplica y ordena', () => {
  assert.deepEqual(parsearSlugs('c,a,zzz,a', new Set(['a', 'b', 'c'])), ['a', 'c'])
  assert.deepEqual(parsearSlugs(null, new Set(['a'])), [])
  assert.deepEqual(parsearSlugs('', new Set(['a'])), [])
})

test('parsearProveedor acepta solo aws/gcp/azure', () => {
  assert.equal(parsearProveedor('gcp'), 'gcp')
  assert.equal(parsearProveedor('oracle'), null)
  assert.equal(parsearProveedor('portable'), null)
  assert.equal(parsearProveedor(null), null)
})

test('la frontera son los nodos sin prerequisitos pendientes, en el orden de la ruta', () => {
  // a <- b <- c ; e <- f ; d suelto — la ruta completa sale a, d, e, b, f, c
  const ruta = subgrafo(GRAFO, ['c', 'f', 'd'], []).ruta
  assert.deepEqual(frontera(ruta).map(n => n.slug), ['a', 'd', 'e'])
})

test('la frontera avanza al dar por sabido un nodo', () => {
  const ruta = subgrafo(GRAFO, ['c'], []).ruta
  const { pendientes } = aplicarSabidos(ruta, ['a'])
  assert.deepEqual(frontera(pendientes).map(n => n.slug), ['b'])
})

test('dar por sabido un nodo arrastra a sus prerequisitos', () => {
  const ruta = subgrafo(GRAFO, ['c'], []).ruta
  const { pendientes, sabidos } = aplicarSabidos(ruta, ['b'])
  assert.deepEqual(pendientes.map(n => n.slug), ['c'])
  assert.deepEqual(sabidos.map(n => n.slug), ['a', 'b'])
})

test('aplicarSabidos con lista vacía devuelve la ruta intacta', () => {
  const ruta = subgrafo(GRAFO, ['c'], []).ruta
  const { pendientes, sabidos } = aplicarSabidos(ruta, [])
  assert.deepEqual(pendientes, ruta)
  assert.deepEqual(sabidos, [])
})

const impl = (nombre: string, proveedor: RoadmapImplementation['proveedor']): RoadmapImplementation => ({
  nombre, proveedor, tool_slug: null, equivalencia: 'alta', nota: null,
  release_count: null, last_version: null, last_published_at: null, article_count: null,
})

test('priorizarProveedor pone el proveedor primero, conserva el resto en orden y no toca la ruta', () => {
  const cloud = { ...nodo('x'), implementaciones: [impl('K8s', 'portable'), impl('EKS', 'aws'), impl('GKE', 'gcp'), impl('AKS', 'azure')] }
  const [out] = priorizarProveedor([cloud], 'gcp')
  assert.deepEqual(out.implementaciones.map(i => i.nombre), ['GKE', 'K8s', 'EKS', 'AKS'])
  assert.deepEqual(priorizarProveedor([cloud], null), [cloud])
  assert.deepEqual(priorizarProveedor([cloud, nodo('y')], 'aws').map(n => n.slug), ['x', 'y'])
  // no muta el original
  assert.equal(cloud.implementaciones[0].nombre, 'K8s')
})

test('tieneNubes ignora portable y nodos sin implementaciones', () => {
  assert.equal(tieneNubes([nodo('a'), { ...nodo('k'), implementaciones: [impl('K8s', 'portable')] }]), false)
  assert.equal(tieneNubes([{ ...nodo('s'), implementaciones: [impl('S3', 'aws')] }]), true)
})

// --- Fase 4: el fixture dorado que comparte con pipeline/roadmap.py ---

test('subgrafo coincide con el fixture dorado generado por Python', () => {
  const datos = JSON.parse(
    readFileSync(new URL('../../tests/fixtures/rutas_esperadas.json', import.meta.url), 'utf8'),
  ) as {
    grafo: { slug: string; nivel: number; orden_sugerido: number; prerequisitos: string[] }[]
    objetivos: Record<string, string[]>
    partidas: Record<string, string[]>
    rutas: Record<string, { ruta: string[]; sabidos: string[] }>
  }
  const nodes = datos.grafo.map(n => ({ ...nodo(n.slug, n.prerequisitos, n.nivel), orden_sugerido: n.orden_sugerido }))
  const claves = Object.keys(datos.rutas)
  assert.ok(claves.length > 0)
  for (const clave of claves) {
    const [o, p] = clave.split('/')
    const { ruta, sabidos } = subgrafo(nodes, datos.objetivos[o], datos.partidas[p])
    assert.deepEqual(ruta.map(n => n.slug), datos.rutas[clave].ruta, clave)
    assert.deepEqual(sabidos.map(n => n.slug), datos.rutas[clave].sabidos, clave)
  }
})
