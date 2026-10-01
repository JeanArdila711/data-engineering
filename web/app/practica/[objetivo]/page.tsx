import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getRetos, getRoadmapWizard } from '@/lib/db'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

type Params = Promise<{ objetivo: string }>

async function resolver(params: Params) {
  const { objetivo } = await params
  const [opciones, retos] = await Promise.all([getRoadmapWizard(), getRetos()])
  const o = opciones.find(x => x.kind === 'objetivo' && x.slug === objetivo)
  const r = retos.find(x => x.objetivo_slug === objetivo)
  return o && r && r.escenario !== null ? { o, r } : null
}

// Solo los objetivos que tienen reto se prerenderizan. Un objetivo sin reto
// da 404, no una página vacía (spec, sección Frontend).
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
  const { o, r } = resuelto
  const conFalla = r.checklist.filter(item => item.experiencia_texto)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black text-white relative">
        <section className="mx-auto max-w-3xl px-6 pb-8 pt-32">
          <p className="text-sm uppercase tracking-wide text-neutral-500">Reto de punta a punta</p>
          <h1 className="mt-2 text-3xl font-bold">{o.nombre}</h1>
          <p className="mt-4 whitespace-pre-line text-neutral-300">{r.escenario}</p>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-8">
          <h2 className="mb-4 text-xl font-semibold">Sabés que lo lograste si…</h2>
          <ul className="space-y-3">
            {r.checklist.map(item => (
              <li key={item.slug} className="rounded-lg border border-neutral-800 p-4">
                <p className="text-neutral-200">{item.dominado_cuando}</p>
              </li>
            ))}
          </ul>
        </section>

        {conFalla.length > 0 && (
          <section className="mx-auto max-w-3xl px-6 pb-8">
            <h2 className="mb-4 text-xl font-semibold">Esto es lo que se rompe</h2>
            <ul className="space-y-3">
              {conFalla.map(item => (
                <li key={item.slug} className="rounded-lg border border-neutral-800 p-4">
                  <p className="text-neutral-300">{item.experiencia_texto}</p>
                  {item.experiencia_link && (
                    <a
                      href={item.experiencia_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-400 hover:underline"
                    >
                      {item.experiencia_link.includes('/commit/') ? 'Ver el commit' : 'Ver la evidencia'}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mx-auto max-w-3xl px-6 pb-24">
          <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-6 text-sm text-neutral-400">
            <p>
              <strong className="text-neutral-200">No hay una solución que comparar.</strong> Tu fuente, tu
              storage y tu forma de resolverlo van a ser distintos a los de cualquier otra persona — eso es
              real, no un hueco del sitio. Un pipeline se valida corriendo, no contra una plantilla. Usá el
              checklist como tu propio code review: si podés marcar cada punto de verdad, lo lograste.
            </p>
            <p>Acá no hay nadie revisando tu resultado. Si querés que otra persona lo mire, este no es el lugar.</p>
          </div>
        </section>
        <Footer />
      </main>
    </>
  )
}
