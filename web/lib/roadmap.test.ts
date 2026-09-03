import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ordenarTopologico, agruparPorNivel, clausuraPrerequisitos, subgrafo, metasAlcanzadas, type RoadmapNode } from './roadmap.ts'

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
