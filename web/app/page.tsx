import { getChangelog } from '@/lib/db'

export default async function Home() {
  const entries = await getChangelog()

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">DE Radar</h1>
      <p className="mt-2 text-neutral-500">
        Releases del ecosistema de Data Engineering, actualizados a diario.
      </p>

      <ul className="mt-10 space-y-6">
        {entries.map((entry) => (
          <li key={entry.release_id} className="border-b border-neutral-200 pb-6">
            <div className="flex items-baseline gap-3">
              <a href={entry.source_url} className="text-lg font-semibold hover:underline">
                {entry.tool_name} {entry.version}
              </a>
              {entry.has_breaking && (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  breaking
                </span>
              )}
            </div>

            <time className="text-sm text-neutral-500">
              {new Date(entry.published_at).toLocaleDateString('es-CO')}
            </time>

            {entry.breaking_changes.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {entry.breaking_changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
