import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

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

export async function getChangelog(limit = 100): Promise<ChangelogEntry[]> {
  return sql<ChangelogEntry[]>`
    select release_id, tool_slug, tool_name, category, version,
           published_at, source_url, has_breaking, breaking_changes
    from mart_changelog
    order by published_at desc
    limit ${limit}
  `
}
