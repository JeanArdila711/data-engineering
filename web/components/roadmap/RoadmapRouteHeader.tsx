import Link from 'next/link'
import type { RoadmapNode, WizardOption } from '@/lib/roadmap'
import { Target, ArrowLeft, CheckCircle2 } from 'lucide-react'
import ShareButton from './ShareButton'

export default function RoadmapRouteHeader({
  objetivo, partida, total, sabidos,
}: { objetivo: WizardOption; partida: WizardOption; total: number; sabidos: RoadmapNode[] }) {
  return (
    <header className="mx-auto max-w-5xl px-5 md:px-6 pt-28 md:pt-36 pb-8">
      {/* Eyebrow Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-400 w-fit mb-3">
        <Target size={13} className="text-emerald-400" />
        <span>[05] // RUMBO PERSONALIZADO</span>
      </div>

      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white uppercase leading-[1.1]">
        {objetivo.nombre}
      </h1>
      <p className="mt-3 text-neutral-400 text-sm md:text-base font-light leading-relaxed max-w-3xl">
        {objetivo.descripcion.trim()}
      </p>

      {/* Telemetry Status Strip */}
      <div className="mt-5 p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/70 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
        <div className="flex items-center gap-3">
          <span className="text-neutral-500">Punto de partida:</span>
          <span className="text-neutral-200 font-sans font-medium px-2.5 py-1 rounded-full border border-neutral-800 bg-neutral-900/80">
            {partida.nombre}
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">{total} nodos por recorrer</span>
        </div>
      </div>

      {sabidos.length > 0 && (
        // <details> nativo: colapsable sin estado ni JS.
        <details className="mt-4 rounded-xl border border-neutral-800/60 bg-neutral-950/40 p-4 text-xs font-mono text-neutral-400">
          <summary className="cursor-pointer hover:text-neutral-200 transition-colors flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>Damos por sabidos {sabidos.length} nodos que esta ruta también requiere (clic para ver)</span>
          </summary>
          <ul className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-neutral-800/60 font-sans">
            {sabidos.map(n => (
              <li key={n.slug} className="rounded-full border border-neutral-800 bg-neutral-900/80 px-3 py-1 text-xs text-neutral-300">
                {n.nombre}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-6 flex items-center gap-4">
        <ShareButton />
        <Link href="/ruta#armar" className="text-xs font-mono text-neutral-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 underline-offset-4 hover:underline">
          <ArrowLeft size={13} />
          <span>Cambiar respuestas</span>
        </Link>
      </div>
    </header>
  )
}
