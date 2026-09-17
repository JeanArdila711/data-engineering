import { getGlossary, getRoadmapLevels } from '@/lib/db'
import GlosarioHero from '@/components/glosario/GlosarioHero'
import GlosarioSection from '@/components/glosario/GlosarioSection'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Glosario — DE Radar',
  description:
    'Jerga real de Data Engineering: 53 términos de trinchera y arquitectura verificados contra documentación oficial primaria, sin alucinaciones.',
}

export default async function GlosarioPage() {
  const [terminos, niveles] = await Promise.all([getGlossary(), getRoadmapLevels()])
  
  const curadosCount = terminos.filter(t => t.origen === 'termino').length
  const nodosCount = terminos.filter(t => t.origen === 'nodo').length
  const nivelesCount = Object.keys(niveles).length || new Set(terminos.map(t => t.nivel)).size

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black text-white relative">
        <GlosarioHero
          totalTerminos={terminos.length}
          curadosCount={curadosCount}
          nodosCount={nodosCount}
          nivelesCount={nivelesCount}
        />
        <GlosarioSection terminos={terminos} niveles={niveles} />
        <Footer />
      </main>
    </>
  )
}
