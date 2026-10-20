import { getRoadmap, getRoadmapLevels, getRoadmapWizard, getRetos } from '@/lib/db'
import { agruparPorNivel } from '@/lib/roadmap'
import PracticaHero from '@/components/practica/PracticaHero'
import PracticaDirectorio from '@/components/practica/PracticaDirectorio'
import RetoCard from '@/components/practica/RetoCard'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Workflow } from 'lucide-react'
import { ScrollRevealTitle } from '@/components/ui/scroll-reveal-title'

export const metadata = {
  title: 'Práctica — DE Radar',
  description:
    'Dónde practicar Data Engineering: recursos externos curados por habilidad y retos de punta a punta con checklist y fallas reales de producción.',
}

export default async function PracticaPage() {
  const [nodes, opciones, retos, niveles] = await Promise.all([
    getRoadmap(),
    getRoadmapWizard(),
    getRetos(),
    getRoadmapLevels(),
  ])
  const objetivos = opciones.filter(o => o.kind === 'objetivo')
  const grupos = agruparPorNivel(nodes.filter(n => n.practica_externa.length > 0))

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black text-white relative">
        {/* 1. Hero 60/40 con Consola Interactiva workbench-preflight.sh y Telemetría */}
        <PracticaHero />

        {/* 2. Sección de Retos de Punta a Punta Autoevaluados */}
        {retos.length > 0 && (
          <section id="retos" className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pb-16 scroll-mt-24">
            <div className="mb-8 border-t border-neutral-800/80 pt-12 flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-400 w-fit">
                <Workflow size={12} className="text-emerald-400" />
                <span>[07.1] // RETOS DE PUNTA A PUNTA · AUTOEVALUADOS</span>
              </div>

              <ScrollRevealTitle
                text="Retos de Arquitectura Real"
                as="h2"
                className="text-2xl sm:text-4xl font-bold tracking-tight uppercase leading-[1.1] text-white font-heading"
              />

              <p className="text-sm md:text-base text-neutral-400 font-light max-w-3xl leading-relaxed">
                Un reto por objetivo del wizard de Rumbo. Cada punto del checklist proviene de los criterios de dominio del grafo de datos y cuenta con fallas reales comprobadas en producción. Los objetivos sin reto activo muestran de frente su motivo de ausencia.
              </p>
            </div>

            {/* Grid de Cockpits de Reto */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {objetivos.map((o, index) => (
                <RetoCard
                  key={o.slug}
                  objetivo={o}
                  reto={retos.find(r => r.objetivo_slug === o.slug) ?? null}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* 3. Directorio Curado de Habilidades Atómicas */}
        <PracticaDirectorio grupos={grupos} niveles={niveles} />

        <Footer />
      </main>
    </>
  )
}
