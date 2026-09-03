import postgres from 'postgres'
import type { RoadmapNode, WizardOption } from './roadmap'

export type ChangelogEntry = {
  release_id: number
  tool_slug: string
  tool_name: string
  category: string
  version: string
  published_at: Date
  source_url: string
  has_breaking: boolean
  breaking_changes: string[]
}

export type ArticleEntry = {
  article_id: number
  url: string
  title: string
  author: string | null
  published_at: Date
  relevance_score: number
  tool_names: string[]
  tool_slugs: string[]
  summary_en: string | null
  summary_es: string | null
}

export type ReleaseHistoryItem = {
  version: string
  published_at: string
  has_breaking: boolean
  source_url: string
}

export type EcosystemStat = {
  tool_slug: string
  tool_name: string
  category: string
  vendor: string | null
  repo: string | null
  homepage: string | null
  tracked_since: Date
  release_count: number
  breaking_release_count: number
  last_version: string | null
  last_published_at: Date | null
  last_has_breaking: boolean | null
  release_history: ReleaseHistoryItem[]
  article_count: number
}

export type DigestArticle = {
  article_id: number
  title: string
  url: string
  summary_en: string | null
  summary_es: string | null
}

export type DigestEntry = {
  tool_slug: string
  tool_name: string
  category: string
  release_count_7d: number
  breaking_count_7d: number
  releases_7d: ReleaseHistoryItem[]
  article_count_7d: number
  top_articles_7d: DigestArticle[]
}

let sql: ReturnType<typeof postgres> | null = null

function getSqlClient() {
  if (!process.env.DATABASE_URL) {
    return null
  }
  if (!sql) {
    sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      connect_timeout: 5,
      max: 5,
    })
  }
  return sql
}

export async function getChangelog(limit = 100): Promise<ChangelogEntry[]> {
  try {
    const client = getSqlClient()
    if (!client) {
      return []
    }
    return await client<ChangelogEntry[]>`
      select release_id, tool_slug, tool_name, category, version,
             published_at, source_url, has_breaking, breaking_changes
      from mart_changelog
      order by published_at desc
      limit ${limit}
    `
  } catch (error) {
    console.warn('Postgres connection unavailable, falling back to static data:', error)
    return []
  }
}

export async function getArticles(limit = 50): Promise<ArticleEntry[]> {
  try {
    const client = getSqlClient()
    if (!client) {
      return []
    }
    return await client<ArticleEntry[]>`
      select article_id, url, title, author, published_at,
             relevance_score, tool_names, tool_slugs,
             summary_en, summary_es
      from mart_articles
      order by (case when summary_es is not null or summary_en is not null then 1 else 0 end) desc, published_at desc
      limit ${limit}
    `
  } catch (error) {
    console.warn('Postgres connection unavailable for articles, falling back to static data:', error)
    return []
  }
}

export async function getEcosystemStats(): Promise<EcosystemStat[]> {
  try {
    const client = getSqlClient()
    if (!client) {
      return []
    }
    const rows = await client<any[]>`
      select tool_slug, tool_name, category, vendor, repo, homepage,
             tracked_since, release_count, breaking_release_count,
             last_version, last_published_at, last_has_breaking,
             release_history, article_count
      from mart_ecosystem
      order by release_count desc
    `
    return rows.map(r => ({
      ...r,
      release_count: Number(r.release_count || 0),
      breaking_release_count: Number(r.breaking_release_count || 0),
      article_count: Number(r.article_count || 0),
      release_history: Array.isArray(r.release_history) 
        ? r.release_history 
        : (typeof r.release_history === 'string' ? JSON.parse(r.release_history) : [])
    }))
  } catch (error) {
    console.warn('Postgres connection unavailable for ecosystem stats, falling back to static data:', error)
    return []
  }
}

export async function getDigest(): Promise<DigestEntry[]> {
  try {
    const client = getSqlClient()
    if (!client) {
      return []
    }
    const rows = await client<any[]>`
      select tool_slug, tool_name, category,
             release_count_7d, breaking_count_7d, releases_7d,
             article_count_7d, top_articles_7d
      from mart_digest
      order by (release_count_7d + article_count_7d) desc
    `
    return rows.map(r => ({
      tool_slug: r.tool_slug,
      tool_name: r.tool_name,
      category: r.category,
      release_count_7d: Number(r.release_count_7d || 0),
      breaking_count_7d: Number(r.breaking_count_7d || 0),
      releases_7d: Array.isArray(r.releases_7d) 
        ? r.releases_7d 
        : (typeof r.releases_7d === 'string' ? JSON.parse(r.releases_7d) : []),
      article_count_7d: Number(r.article_count_7d || 0),
      top_articles_7d: Array.isArray(r.top_articles_7d) 
        ? r.top_articles_7d 
        : (typeof r.top_articles_7d === 'string' ? JSON.parse(r.top_articles_7d) : [])
    }))
  } catch (error) {
    console.warn('Postgres connection unavailable for digest, falling back to static data:', error)
    return []
  }
}

export async function getRoadmap(): Promise<RoadmapNode[]> {
  try {
    const client = getSqlClient()
    if (!client) {
      return []
    }
    return await client<RoadmapNode[]>`
      select slug, tipo, nombre, resuelve, dominado_cuando, nivel, orden_sugerido,
             experiencia_texto, experiencia_link, prerequisitos, implementaciones, fuentes
      from mart_roadmap
      order by nivel, orden_sugerido, slug
    `
  } catch (error) {
    console.warn('Postgres connection unavailable, falling back to static data:', error)
    return []
  }
}

export async function getRoadmapWizard(): Promise<WizardOption[]> {
  try {
    const client = getSqlClient()
    if (!client) return []
    return await client<WizardOption[]>`
      select kind, slug, nombre, descripcion, orden, nodos
      from mart_roadmap_wizard
      order by kind, orden
    `
  } catch (error) {
    console.warn('Postgres connection unavailable for wizard options:', error)
    return []
  }
}
