import Link from 'next/link'
import type { WizardOption } from '@/lib/roadmap'
import type { RetoEntry } from '@/lib/db'

export default function RetoCard({ objetivo, reto }: { objetivo: WizardOption; reto: RetoEntry | null }) {
  const tieneReto = reto !== null && reto.escenario !== null

  if (!tieneReto) {
    return (
      <div className="rounded-lg border border-neutral-900 bg-neutral-950 p-6">
        <h3 className="text-lg font-semibold text-neutral-400">{objetivo.nombre}</h3>
        <p className="mt-2 text-sm text-neutral-400">{reto?.motivo_ausencia ?? 'Sin reto todavía.'}</p>
      </div>
    )
  }

  return (
    <Link
      href={`/practica/${objetivo.slug}`}
      className="block rounded-lg border border-neutral-800 bg-neutral-900 p-6 transition-colors hover:border-neutral-600"
    >
      <h3 className="text-lg font-semibold text-white">{objetivo.nombre}</h3>
      <p className="mt-2 text-sm text-neutral-400">
        {reto.checklist.length} puntos de checklist, cada uno con una falla real detrás.
      </p>
    </Link>
  )
}
