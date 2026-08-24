import { getChangelog, getArticles, ChangelogEntry, ArticleEntry } from '@/lib/db'
import Hero from '@/components/Hero'
import Manifesto from '@/components/Manifesto'
import EcosystemSection from '@/components/EcosystemSection'
import ArticlesSection from '@/components/ArticlesSection'
import ParticlesBackground from '@/components/ParticlesBackground'
import Navbar from '@/components/layout/Navbar'

export default async function Home() {
  let entries: ChangelogEntry[] = []
  let articles: ArticleEntry[] = []

  try {
    const [fetchedEntries, fetchedArticles] = await Promise.all([
      getChangelog().catch(() => []),
      getArticles().catch(() => []),
    ])
    entries = fetchedEntries
    articles = fetchedArticles
  } catch (error) {
    console.error('Error fetching data from DB:', error)
  }

  return (
    <main className="w-full flex flex-col items-center min-h-screen bg-black text-white relative">
      {/* Dynamic Unified Navbar (Desktop Magnetic Pill + Mobile Auto-hide Overlay) */}
      <Navbar />

      {/* Global Interactive Data Cosmos Background */}
      <ParticlesBackground />

      {/* 1. Hero with Typewriter Terminal & Scramble Stats */}
      <Hero />
      
      {/* 2. Manifesto with Scroll Reveal & Git Diff */}
      <Manifesto />
      
      {/* 3. Interactive Ecosystem Radar & Tool Directory */}
      <EcosystemSection entries={entries} />

      {/* 4. Curated Technical Articles & Anchored Summaries (Fase 2) */}
      <ArticlesSection articles={articles} />
    </main>
  )
}
