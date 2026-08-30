import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ordenarTopologico, agruparPorNivel, type RoadmapNode } from './roadmap.ts'

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
