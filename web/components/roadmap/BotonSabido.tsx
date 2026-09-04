'use client'

import { Check, Undo2 } from 'lucide-react'

/** Toggle de "ya lo sé". `stopPropagation` porque en Fichas vive dentro de una tarjeta clicable. */
export default function BotonSabido({ sabido, onClick }: { sabido: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={sabido}
      onClick={e => { e.stopPropagation(); onClick() }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors ${
        sabido
          ? 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white'
          : 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
      }`}
    >
      {sabido ? <Undo2 size={12} /> : <Check size={12} />}
      <span>{sabido ? 'Marcar pendiente' : 'Ya sé esto'}</span>
    </button>
  )
}
