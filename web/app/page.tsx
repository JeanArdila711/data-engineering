import { getChangelog, ChangelogEntry } from '@/lib/db'
import Hero from '@/components/Hero'
import Manifesto from '@/components/Manifesto'
import EcosystemSection from '@/components/EcosystemSection'
import ParticlesBackground from '@/components/ParticlesBackground'

export default async function Home() {
  let entries: ChangelogEntry[] = []
  try {
    entries = await getChangelog()
  } catch (error) {
    console.error('Error fetching changelog entries from DB:', error)
  }

  return (
    <main className="w-full flex flex-col items-center min-h-screen bg-black text-white relative">
      {/* Global Interactive Data Cosmos Background */}
      <ParticlesBackground />

      {/* 1. Hero with Typewriter Terminal & Scramble Stats */}
      <Hero />
      
      {/* 2. Manifesto with Scroll Reveal & Git Diff */}
      <Manifesto />
      
      {/* 3. Interactive Ecosystem Radar & Tool Directory */}
      <EcosystemSection entries={entries} />
    </main>
  )
}
