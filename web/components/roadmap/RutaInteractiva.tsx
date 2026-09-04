'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Flag, RotateCcw } from 'lucide-react'
import {
  agruparPorNivel, aplicarSabidos, clausuraPrerequisitos, frontera, parsearProveedor, parsearSlugs,
  priorizarProveedor, tieneNubes, type Proveedor, type RoadmapNode,
} from '@/lib/roadmap'
import RoadmapSection from '@/components/RoadmapSection'
import ProveedorSelector from './ProveedorSelector'

type Props = {
  /** En orden topológico, tal como sale de subgrafo() o de ordenarTopologico(). */
  ruta: RoadmapNode[]
  /** Sabidos base del wizard (fuera de `ruta`), solo para resolver nombres de prerequisitos. */
  sabidosBase?: RoadmapNode[]
  notas?: Record<string, string>
  encabezado?: boolean
}

/**
 * Lee `?ya=` y `?cloud=`, deriva pendientes / sabidos / frontera y se los pasa
 * a RoadmapSection. La URL es la única fuente de verdad: no hay useState.
 * Se monta dentro de <Suspense> porque useSearchParams lo exige en páginas
 * estáticas (Next 16); el fallback es la ruta completa, idéntica a la Fase 2.
 */
export default function RutaInteractiva({ ruta, sabidosBase = [], notas = {}, encabezado = false }: Props) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const validos = useMemo(() => new Set(ruta.map(n => n.slug)), [ruta])
  const ya = useMemo(() => parsearSlugs(params.get('ya'), validos), [params, validos])
  const cloud = parsearProveedor(params.get('cloud'))

  const { pendientes, sabidos } = useMemo(() => aplicarSabidos(ruta, ya), [ruta, ya])
  const front = useMemo(() => new Set(frontera(pendientes).map(n => n.slug)), [pendientes])
  const vista = useMemo(() => priorizarProveedor(pendientes, cloud), [pendientes, cloud])
  const grupos = useMemo(() => agruparPorNivel(vista), [vista])

  const escribir = useCallback(
    (cambios: { ya?: string[]; cloud?: Proveedor | null }) => {
      const q = new URLSearchParams(params.toString())
      if (cambios.ya !== undefined) {
        const canonico = parsearSlugs(cambios.ya.join(','), validos)
        if (canonico.length === 0) q.delete('ya')
        else q.set('ya', canonico.join(','))
      }
      if (cambios.cloud !== undefined) {
        if (cambios.cloud === null) q.delete('cloud')
        else q.set('cloud', cambios.cloud)
      }
      const qs = q.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [params, pathname, router, validos],
  )

  const toggle = useCallback((slug: string) => {
    const yaSabido = sabidos.some(n => n.slug === slug)
    escribir({
      ya: yaSabido
        ? ya.filter(s => !clausuraPrerequisitos(ruta, [s]).has(slug))
        : [...ya, slug],
    })
  }, [ya, sabidos, ruta, escribir])

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-neutral-400">
          <span className="text-emerald-400 font-semibold">{pendientes.length} pendientes</span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            {sabidos.length} ya sabés
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Flag size={13} className="text-amber-400" />
            {front.size} para arrancar
          </span>
          {ya.length > 0 && (
            <button
              type="button"
              onClick={() => escribir({ ya: [] })}
              className="inline-flex items-center gap-1 text-neutral-500 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              <RotateCcw size={12} />
              Limpiar lo marcado
            </button>
          )}
        </div>
        {tieneNubes(ruta) && <ProveedorSelector valor={cloud} onChange={p => escribir({ cloud: p })} />}
      </div>

      {pendientes.length === 0 ? (
        <p className="mx-auto max-w-6xl px-4 sm:px-6 py-16 text-neutral-400">
          Con lo que marcaste, esta ruta no tiene nodos pendientes.
        </p>
      ) : (
        <RoadmapSection
          grupos={grupos}
          notas={notas}
          encabezado={encabezado}
          sabidos={[...sabidosBase, ...sabidos]}
          frontera={front}
          togglables={validos}
          onToggleSabido={toggle}
        />
      )}
    </>
  )
}
