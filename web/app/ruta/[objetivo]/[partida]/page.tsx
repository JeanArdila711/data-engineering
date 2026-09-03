import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getRoadmap, getRoadmapWizard } from '@/lib/db'
import { agruparPorNivel, metasAlcanzadas, subgrafo } from '@/lib/roadmap'
import RoadmapSection from '@/components/RoadmapSection'
import RoadmapRouteHeader from '@/components/roadmap/RoadmapRouteHeader'
import Navbar from '@/components/layout/Navbar'

type Params = Promise<{ objetivo: string; partida: string }>

async function resolver(params: Params) {
  const { objetivo, partida } = await params
  const opciones = await getRoadmapWizard()
  const o = opciones.find(x => x.kind === 'objetivo' && x.slug === objetivo)
  const p = opciones.find(x => x.kind === 'partida' && x.slug === partida)
  return o && p ? { o, p } : null
}

// Las 15 combinaciones se prerenderizan. Si en un build la base no responde,
// esto devuelve [] y las páginas se generan a demanda (dynamicParams por
// defecto) — por eso NO se pone dynamicParams = false.
export async function generateStaticParams() {
  const opciones = await getRoadmapWizard()
  const objetivos = opciones.filter(x => x.kind === 'objetivo')
  const partidas = opciones.filter(x => x.kind === 'partida')
  return objetivos.flatMap(o => partidas.map(p => ({ objetivo: o.slug, partida: p.slug })))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = await resolver(params)
  if (!r) return { title: 'Rumbo — DE Radar' }
  return {
    title: `Rumbo: ${r.o.nombre} · ${r.p.nombre} — DE Radar`,
    description: r.o.descripcion.trim(),
  }
}

export default async function RutaPersonalPage({ params }: { params: Params }) {
  const r = await resolver(params)
  if (!r) notFound()

  const nodes = await getRoadmap()
  const { ruta, sabidos } = subgrafo(nodes, r.o.nodos, r.p.nodos)
  const porQue = metasAlcanzadas(nodes, r.o.nodos)
  const notas = Object.fromEntries(
    ruta.map(n => [n.slug, `Necesario para: ${porQue.get(n.slug)?.join(', ') ?? r.o.nombre}`]),
  )

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <RoadmapRouteHeader objetivo={r.o} partida={r.p} total={ruta.length} sabidos={sabidos} />
        {ruta.length === 0 ? (
          <p className="mx-auto max-w-3xl px-6 py-16 text-neutral-400">
            Con lo que ya sabés, esta ruta no tiene nodos pendientes. Probá un objetivo más amplio.
          </p>
        ) : (
          <RoadmapSection grupos={agruparPorNivel(ruta)} notas={notas} />
        )}
      </main>
    </>
  )
}
