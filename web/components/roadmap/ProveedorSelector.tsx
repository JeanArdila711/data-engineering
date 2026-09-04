'use client'

import { Cloud } from 'lucide-react'
import { PROVEEDORES, type Proveedor } from '@/lib/roadmap'

const ETIQUETA: Record<Proveedor, string> = { aws: 'AWS', gcp: 'GCP', azure: 'Azure' }

export default function ProveedorSelector({
  valor, onChange,
}: { valor: Proveedor | null; onChange: (p: Proveedor | null) => void }) {
  const opciones: { p: Proveedor | null; label: string }[] = [
    { p: null, label: 'Cualquiera' },
    ...PROVEEDORES.map(p => ({ p, label: ETIQUETA[p] })),
  ]
  return (
    <div role="group" aria-label="Priorizar implementaciones de un proveedor cloud" className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-neutral-500">
        <Cloud size={13} />
        Nube:
      </span>
      <div className="flex items-center p-0.5 rounded-lg bg-neutral-950 border border-neutral-800">
        {opciones.map(({ p, label }) => (
          <button
            key={label}
            type="button"
            aria-pressed={valor === p}
            onClick={() => onChange(p)}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              valor === p ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
