import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getRetos, getRoadmapWizard } from '@/lib/db'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { RetoWorkbenchView } from '@/components/practica/RetoWorkbenchView'

type Params = Promise<{ objetivo: string }>

async function resolver(params: Params) {
  const { objetivo } = await params
  const [opciones, retos] = await Promise.all([getRoadmapWizard(), getRetos()])
  const o = opciones.find(x => x.kind === 'objetivo' && x.slug === objetivo)
  const r = retos.find(x => x.objetivo_slug === objetivo)
  if (!o || !r || r.escenario === null) return null

  // Identificar el otro reto activo para salto rápido entre disciplinas
  const otroSlug = objetivo === 'pipelines-batch' ? 'modelado-analitico' : 'pipelines-batch'
  const otroO = opciones.find(x => x.kind === 'objetivo' && x.slug === otroSlug)
  const otroR = retos.find(x => x.objetivo_slug === otroSlug)
  const otroReto =
    otroO && otroR && otroR.escenario !== null
      ? {
          slug: otroO.slug,
          nombre: otroO.nombre,
          descripcion: otroO.descripcion,
          checklistCount: otroR.checklist.length,
        }
      : null

  return { o, r, otroReto }
}

// Solo los objetivos que tienen reto se prerenderizan. Un objetivo sin reto
// da 404, no una página vacía (spec, sección Frontend). Si en un build la base
// no responde, esto devuelve [] y las páginas se generan a demanda
// (dynamicParams por defecto) — por eso NO se pone dynamicParams = false.
export async function generateStaticParams() {
  const retos = await getRetos()
  return retos.filter(r => r.escenario !== null).map(r => ({ objetivo: r.objetivo_slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const resuelto = await resolver(params)
  if (!resuelto) return { title: 'Práctica — DE Radar' }
  return {
    title: `Reto: ${resuelto.o.nombre} — DE Radar`,
    description: resuelto.o.descripcion.trim(),
  }
}

export default async function RetoPage({ params }: { params: Params }) {
  const resuelto = await resolver(params)
  if (!resuelto) notFound()
  const { o, r, otroReto } = resuelto

  return (
    <>
      <Navbar />
      <RetoWorkbenchView objetivo={o} reto={r} otroReto={otroReto} />
      <Footer />
    </>
  )
}
