import { getRoadmap, getRoadmapWizard } from '@/lib/db'
import { agruparPorNivel } from '@/lib/roadmap'
import RoadmapSection from '@/components/RoadmapSection'
import RoadmapWizard from '@/components/roadmap/RoadmapWizard'
import Navbar from '@/components/layout/Navbar'

export const metadata = {
  title: 'Rumbo — DE Radar',
  description:
    'Ruta de aprendizaje de Data Engineering: el concepto es el nodo, las herramientas son formas de practicarlo.',
}

export default async function RutaPage() {
  const [nodes, opciones] = await Promise.all([getRoadmap(), getRoadmapWizard()])
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <RoadmapWizard opciones={opciones} />
        <RoadmapSection grupos={agruparPorNivel(nodes)} />
      </main>
    </>
  )
}
