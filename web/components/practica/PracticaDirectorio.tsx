import type { RoadmapNode } from '@/lib/roadmap'

export default function PracticaDirectorio({
  grupos,
  niveles,
}: {
  grupos: { nivel: number; nodes: RoadmapNode[] }[]
  niveles: Record<number, string>
}) {
  if (grupos.length === 0) return null

  return (
    <section className="mx-auto max-w-5xl px-6 pb-24">
      <h2 className="mb-6 text-2xl font-bold text-white">Directorio curado</h2>
      <div className="space-y-8">
        {grupos.map(({ nivel, nodes }) => (
          <div key={nivel}>
            <h3 className="mb-3 text-sm uppercase tracking-wide text-neutral-500">
              {niveles[nivel] ?? `Nivel ${nivel}`}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {nodes.map(n => (
                <div key={n.slug} className="rounded-lg border border-neutral-800 p-4">
                  <p className="font-medium text-white">{n.nombre}</p>
                  <ul className="mt-2 space-y-2">
                    {n.practica_externa.map(r => (
                      <li key={r.url}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-400 hover:underline"
                        >
                          {r.nombre}
                        </a>
                        <p className="text-xs text-neutral-500">{r.por_que}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
