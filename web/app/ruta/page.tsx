import { getRoadmap } from '@/lib/db'
import { agruparPorNivel } from '@/lib/roadmap'
import RoadmapSection from '@/components/RoadmapSection'
import Navbar from '@/components/layout/Navbar'

export const metadata = {
  title: 'Rumbo — DE Radar',
  description:
    'Ruta de aprendizaje de Data Engineering: el concepto es el nodo, las herramientas son formas de practicarlo.',
}

export default async function RutaPage() {
  const nodes = await getRoadmap()
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <RoadmapSection grupos={agruparPorNivel(nodes)} />
      </main>
    </>
  )
}
