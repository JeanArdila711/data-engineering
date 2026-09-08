'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Search, X } from 'lucide-react'
import type { GlossaryEntry } from '@/lib/db'

type Props = {
  terminos: GlossaryEntry[]
  niveles: Record<number, string>
}

export default function GlosarioSection({ terminos, niveles }: Props) {
  const [query, setQuery] = useState('')
  const [nivelActivo, setNivelActivo] = useState<number | null>(null)

  // Si se entra por un ancla compartida (/glosario#dag-factory), el filtro
  // no puede dejarlo escondido: se limpia apenas hay un hash en la URL.
  useEffect(() => {
    if (window.location.hash) {
      setQuery('')
      setNivelActivo(null)
    }
  }, [])

  const nivelesUsados = useMemo(
    () => [...new Set(terminos.map(t => t.nivel))].sort((a, b) => a - b),
    [terminos],
  )

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return terminos.filter(t => {
      if (nivelActivo !== null && t.nivel !== nivelActivo) return false
      if (!q) return true
      return (
        t.termino.toLowerCase().includes(q) ||
        t.definicion.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
      )
    })
  }, [terminos, query, nivelActivo])

  const agrupados = useMemo(() => {
    const porNivel = new Map<number, GlossaryEntry[]>()
    for (const t of filtrados) {
      porNivel.set(t.nivel, [...(porNivel.get(t.nivel) ?? []), t])
    }
    return [...porNivel.entries()].sort(([a], [b]) => a - b)
  }, [filtrados])

  return (
    <section id="glosario" className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8 border-t border-neutral-800/80 pt-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-400 w-fit">
          <span>[06] // GLOSARIO</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight uppercase leading-[1.1] text-white">
          Jerga real de Data Engineering
        </h1>
        <p className="text-sm md:text-base text-neutral-400 font-light max-w-3xl leading-relaxed">
          {terminos.length} entradas, cada una verificada contra su fuente primaria. Sin
          definiciones de memoria: lo que no tiene una fuente citada, no está acá.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-3.5">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar un término (ej: XCom, grano, backpressure)..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-800 bg-neutral-950/80 text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/70 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-mono">
          <button
            onClick={() => setNivelActivo(null)}
            className={`px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
              nivelActivo === null
                ? 'border-neutral-700 bg-neutral-800 text-white'
                : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white'
            }`}
          >
            Todos ({terminos.length})
          </button>
          {nivelesUsados.map(nivel => (
            <button
              key={nivel}
              onClick={() => setNivelActivo(nivel)}
              className={`px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                nivelActivo === nivel
                  ? 'border-emerald-700/80 bg-emerald-950/40 text-emerald-300'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-emerald-300'
              }`}
            >
              {niveles[nivel] ?? `Nivel ${nivel}`}
            </button>
          ))}
        </div>
      </div>

      {agrupados.length === 0 ? (
        <p className="p-12 rounded-2xl border border-dashed border-neutral-800 text-center font-mono text-sm text-neutral-400">
          No se encontraron términos con ese criterio.
        </p>
      ) : (
        <div className="space-y-10">
          {agrupados.map(([nivel, items]) => (
            <div key={nivel}>
              <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-3">
                {niveles[nivel] ?? `Nivel ${nivel}`}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map(t => (
                  <article
                    key={t.slug}
                    id={t.slug}
                    className="scroll-mt-28 rounded-xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-white">{t.termino}</h3>
                      {t.origen === 'nodo' && (
                        <Link
                          href="/ruta"
                          className="shrink-0 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 whitespace-nowrap"
                        >
                          Ver ruta completa →
                        </Link>
                      )}
                    </div>

                    <p className="text-sm text-neutral-300 leading-relaxed">{t.definicion}</p>

                    {t.uso_texto && (
                      <div className="border-l-2 border-neutral-700 pl-3 text-xs text-neutral-400 leading-relaxed">
                        {t.uso_texto}
                        {t.uso_link && (
                          <a
                            href={t.uso_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 inline-flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300"
                          >
                            ver <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                      {t.fuentes.map(f => (
                        <a
                          key={f.url}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={f.por_que}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-500 hover:text-neutral-300"
                        >
                          <ExternalLink size={10} />
                          fuente
                        </a>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
