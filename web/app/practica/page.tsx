import { getRoadmap, getRoadmapLevels, getRoadmapWizard, getRetos } from '@/lib/db'
import { agruparPorNivel } from '@/lib/roadmap'
import PracticaDirectorio from '@/components/practica/PracticaDirectorio'
import RetoCard from '@/components/practica/RetoCard'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Práctica — DE Radar',
  description:
    'Dónde practicar Data Engineering: recursos externos curados por habilidad y retos de punta a punta con checklist y fallas reales.',
}

export default async function PracticaPage() {
  const [nodes, opciones, retos, niveles] = await Promise.all([
    getRoadmap(), getRoadmapWizard(), getRetos(), getRoadmapLevels(),
  ])
  const objetivos = opciones.filter(o => o.kind === 'objetivo')
  const grupos = agruparPorNivel(nodes.filter(n => n.practica_externa.length > 0))

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black text-white relative">
        <section className="mx-auto max-w-5xl px-6 pb-12 pt-32">
          <h1 className="text-4xl font-bold">Práctica</h1>
          <p className="mt-4 max-w-2xl text-neutral-400">
            Dos formas de ejercitar lo que dice Rumbo: un directorio curado de dónde
            practicar habilidades sueltas, y retos de punta a punta que combinan varias
            etapas del ciclo de vida del dato, con checklist y fallas reales.
          </p>
        </section>
        <section className="mx-auto max-w-5xl px-6 pb-16">
          <h2 className="mb-6 text-2xl font-bold text-white">Retos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {objetivos.map(o => (
              <RetoCard key={o.slug} objetivo={o} reto={retos.find(r => r.objetivo_slug === o.slug) ?? null} />
            ))}
          </div>
        </section>
        <PracticaDirectorio grupos={grupos} niveles={niveles} />
        <Footer />
      </main>
    </>
  )
}
