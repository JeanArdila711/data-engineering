import postgres from 'postgres'

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

export async function getArticles(limit = 30): Promise<ArticleEntry[]> {
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
      where summary_en is not null
      order by published_at desc, relevance_score desc
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
    return await client<EcosystemStat[]>`
      select tool_slug, tool_name, category, vendor, repo, homepage,
             tracked_since, release_count, breaking_release_count,
             last_version, last_published_at, last_has_breaking,
             release_history, article_count
      from mart_ecosystem
      order by release_count desc
    `
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
    return await client<DigestEntry[]>`
      select tool_slug, tool_name, category,
             release_count_7d, breaking_count_7d, releases_7d,
             article_count_7d, top_articles_7d
      from mart_digest
      order by (release_count_7d + article_count_7d) desc
    `
  } catch (error) {
    console.warn('Postgres connection unavailable for digest, falling back to static data:', error)
    return []
  }
}
