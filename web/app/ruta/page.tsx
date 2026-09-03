import { Suspense } from 'react'
import { getRoadmap, getRoadmapWizard } from '@/lib/db'
import { agruparPorNivel, ordenarTopologico } from '@/lib/roadmap'
import RoadmapHero from '@/components/roadmap/RoadmapHero'
import RoadmapWizard from '@/components/roadmap/RoadmapWizard'
import RoadmapSection from '@/components/RoadmapSection'
import RutaInteractiva from '@/components/roadmap/RutaInteractiva'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Rumbo — DE Radar',
  description:
    'Ruta de aprendizaje de Data Engineering: el concepto es el nodo, las herramientas son formas de practicarlo.',
}

export default async function RutaPage() {
  const [nodes, opciones] = await Promise.all([getRoadmap(), getRoadmapWizard()])
  const ruta = ordenarTopologico(nodes)
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black text-white relative">
        <RoadmapHero />
        <RoadmapWizard opciones={opciones} />
        <Suspense fallback={<RoadmapSection grupos={agruparPorNivel(ruta)} encabezado={true} />}>
          <RutaInteractiva ruta={ruta} encabezado={true} />
        </Suspense>
        <Footer />
      </main>
    </>
  )
}
