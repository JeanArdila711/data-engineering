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
