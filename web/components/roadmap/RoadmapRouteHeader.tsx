import Link from 'next/link'
import type { RoadmapNode, WizardOption } from '@/lib/roadmap'
import ShareButton from './ShareButton'

export default function RoadmapRouteHeader({
  objetivo, partida, total, sabidos,
}: { objetivo: WizardOption; partida: WizardOption; total: number; sabidos: RoadmapNode[] }) {
  return (
    <header className="mx-auto max-w-5xl px-6 pt-28 pb-8">
      <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">Tu rumbo</p>
      <h1 className="mt-2 text-3xl font-semibold text-white">{objetivo.nombre}</h1>
      <p className="mt-2 text-neutral-400">{objetivo.descripcion.trim()}</p>
      <p className="mt-4 text-sm text-neutral-300">
        Punto de partida: <span className="text-white">{partida.nombre}</span> · {total} nodos
      </p>
      {sabidos.length > 0 && (
        // <details> nativo: colapsable sin estado ni JS.
        <details className="mt-3 text-sm text-neutral-400">
          <summary className="cursor-pointer">
            Damos por sabidos {sabidos.length} nodos que esta ruta también pide
          </summary>
          <ul className="mt-2 flex flex-wrap gap-2">
            {sabidos.map(n => (
              <li key={n.slug} className="rounded-full border border-neutral-800 px-3 py-1">{n.nombre}</li>
            ))}
          </ul>
        </details>
      )}
      <div className="mt-6 flex items-center gap-3">
        <ShareButton />
        <Link href="/ruta#armar" className="text-sm text-neutral-400 underline-offset-4 hover:underline">
          Cambiar respuestas
        </Link>
      </div>
    </header>
  )
}
