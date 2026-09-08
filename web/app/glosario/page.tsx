import { getGlossary, getRoadmapLevels } from '@/lib/db'
import GlosarioSection from '@/components/glosario/GlosarioSection'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Glosario — DE Radar',
  description:
    'Jerga real de Data Engineering, verificada contra fuente primaria y agrupada por categoría.',
}

export default async function GlosarioPage() {
  const [terminos, niveles] = await Promise.all([getGlossary(), getRoadmapLevels()])
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black text-white relative">
        <GlosarioSection terminos={terminos} niveles={niveles} />
        <Footer />
      </main>
    </>
  )
}
