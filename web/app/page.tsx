import { getChangelog, getArticles, getEcosystemStats, getDigest, ChangelogEntry, ArticleEntry, EcosystemStat, DigestEntry } from '@/lib/db'
import Hero from '@/components/Hero'
import Manifesto from '@/components/Manifesto'
import EcosystemSection from '@/components/EcosystemSection'
import ArticlesSection from '@/components/ArticlesSection'
import DigestSection from '@/components/DigestSection'
import ParticlesBackground from '@/components/ParticlesBackground'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default async function Home() {
  let entries: ChangelogEntry[] = []
  let articles: ArticleEntry[] = []
  let ecosystemStats: EcosystemStat[] = []
  let digest: DigestEntry[] = []

  try {
    const [fetchedEntries, fetchedArticles, fetchedStats, fetchedDigest] = await Promise.all([
      getChangelog().catch(() => []),
      getArticles().catch(() => []),
      getEcosystemStats().catch(() => []),
      getDigest().catch(() => []),
    ])
    entries = fetchedEntries
    articles = fetchedArticles
    ecosystemStats = fetchedStats
    digest = fetchedDigest
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
      <EcosystemSection entries={entries} ecosystemStats={ecosystemStats} />

      {/* 4. Curated Technical Articles & Anchored Summaries (Fase 2) */}
      <ArticlesSection articles={articles} />

      {/* 5. Weekly Digest — Releases & Articles from the Last 7 Days (Fase 3) */}
      <DigestSection entries={digest} />

      {/* 6. Engineering Telemetry Footer & Systems Status */}
      <Footer />
    </main>
  )
}
