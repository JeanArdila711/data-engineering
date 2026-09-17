'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  X,
  ExternalLink,
  Link2,
  Check,
  Terminal,
  ShieldCheck,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  Compass,
  Code2,
  Boxes,
  ArrowDownToLine,
  Columns3,
  Layers,
  GitFork,
  Clock,
  Activity,
  Cloud,
  Sliders,
  Filter
} from 'lucide-react'
import type { GlossaryEntry } from '@/lib/db'
import { useToast } from '@/components/ui/toast'
import {
  CardCurtainReveal,
  CardCurtainRevealBody,
  CardCurtainRevealTitle,
  CardCurtainRevealDescription,
  CardCurtain
} from '@/components/ui/card-curtain-reveal'

type Props = {
  terminos: GlossaryEntry[]
  niveles: Record<number, string>
}

type OrigenFiltro = 'todos' | 'termino' | 'nodo'

const ITEMS_PER_PAGE = 6
const customEase = [0.16, 1, 0.3, 1] as const

// Mapa de íconos vectoriales sobrios y limpios para cada nivel
const ICON_BY_LEVEL: Record<number, React.ComponentType<{ className?: string }>> = {
  0: Code2,            // Base / Fundamentos
  1: Boxes,            // Modelo Mental
  2: ArrowDownToLine,  // Ingesta
  3: Columns3,         // Formatos Columnares
  4: Layers,           // Open Table Formats
  5: GitFork,          // Transformación & dbt
  6: Clock,            // Orquestación & Airflow
  7: Activity,         // Streaming & Kafka
  8: Cloud,            // Plataforma Cloud
  9: Sliders,          // Transversales & Distribuido
}

function extractHostname(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return 'Documentación oficial'
  }
}

// Variantes direction-aware ágiles
const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 28 : -28,
    opacity: 0,
    filter: 'blur(2px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.22,
      ease: customEase,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -28 : 28,
    opacity: 0,
    filter: 'blur(2px)',
    transition: {
      duration: 0.16,
      ease: customEase,
    },
  }),
}

export default function GlosarioSection({ terminos, niveles }: Props) {
  const { showToast } = useToast()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const catalogTopRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [nivelActivo, setNivelActivo] = useState<number | null>(null)
  const [origenActivo, setOrigenActivo] = useState<OrigenFiltro>('todos')
  
  // Paginación Cinemática
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [direction, setDirection] = useState<number>(0)

  const [activeHash, setActiveHash] = useState<string>('')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  // 1. Conteo de términos por origen y por nivel
  const { curadosCount, nodosCount, nivelesConConteo } = useMemo(() => {
    let curados = 0
    let nodos = 0
    const conteoPorNivel: Record<number, number> = {}

    for (const t of terminos) {
      if (t.origen === 'termino') curados++
      if (t.origen === 'nodo') nodos++
      conteoPorNivel[t.nivel] = (conteoPorNivel[t.nivel] ?? 0) + 1
    }

    const nivelesOrdenados = Object.keys(conteoPorNivel)
      .map(Number)
      .sort((a, b) => a - b)
      .map(nivel => ({
        nivel,
        nombre: niveles[nivel] ?? `Nivel ${nivel}`,
        Icon: ICON_BY_LEVEL[nivel] ?? Layers,
        count: conteoPorNivel[nivel] ?? 0,
      }))

    return {
      curadosCount: curados,
      nodosCount: nodos,
      nivelesConConteo: nivelesOrdenados,
    }
  }, [terminos, niveles])

  // 2. Filtrado reactivo de términos
  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return terminos.filter(t => {
      if (origenActivo !== 'todos' && t.origen !== origenActivo) return false
      if (nivelActivo !== null && t.nivel !== nivelActivo) return false
      if (!q) return true

      return (
        t.termino.toLowerCase().includes(q) ||
        t.definicion.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.uso_texto && t.uso_texto.toLowerCase().includes(q))
      )
    })
  }, [terminos, query, nivelActivo, origenActivo])

  // Resetear a página 1 en cada cambio de filtro
  useEffect(() => {
    setCurrentPage(1)
    setDirection(0)
  }, [query, nivelActivo, origenActivo])

  // 3. Manejo del Hash de la URL para Anclaje y Salto Automático de Página
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setActiveHash(hash)
        
        const termIndex = terminos.findIndex(t => t.slug === hash)
        if (termIndex !== -1) {
          setQuery('')
          setNivelActivo(null)
          setOrigenActivo('todos')
          
          const targetPage = Math.floor(termIndex / ITEMS_PER_PAGE) + 1
          setCurrentPage(targetPage)

          setTimeout(() => {
            const el = document.getElementById(hash)
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 180)
        }
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [terminos])

  useEffect(() => {
    if (!activeHash) return
    const timer = setTimeout(() => {
      setActiveHash('')
    }, 4000)
    return () => clearTimeout(timer)
  }, [activeHash])

  // 4. Shortcuts de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = document.activeElement === searchInputRef.current

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      } else if (e.key === 'Escape' && isInputFocused) {
        if (query) {
          setQuery('')
        } else {
          searchInputRef.current?.blur()
        }
      } else if (!isInputFocused && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const totalP = Math.ceil(filtrados.length / ITEMS_PER_PAGE)
        if (e.key === 'ArrowLeft') {
          handlePageChange(currentPage - 1, totalP)
        } else if (e.key === 'ArrowRight') {
          handlePageChange(currentPage + 1, totalP)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [query, currentPage, filtrados.length])

  // Paginación calculada
  const totalPages = Math.max(1, Math.ceil(filtrados.length / ITEMS_PER_PAGE))
  const paginatedTerminos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtrados.slice(start, start + ITEMS_PER_PAGE)
  }, [filtrados, currentPage])

  const handlePageChange = (newPage: number, total = totalPages) => {
    if (newPage < 1 || newPage > total || newPage === currentPage) return
    setDirection(newPage > currentPage ? 1 : -1)
    setCurrentPage(newPage)

    if (catalogTopRef.current) {
      const rect = catalogTopRef.current.getBoundingClientRect()
      if (rect.top < 0) {
        catalogTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const handleCopyLink = (slug: string, termino: string) => {
    const url = `${window.location.origin}/glosario#${slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug)
      setActiveHash(slug)
      showToast(`Enlace a "${termino}" copiado`, `#${slug}`)
      window.history.replaceState(null, '', `#${slug}`)
      setTimeout(() => setCopiedSlug(null), 2000)
    })
  }

  const limpiarTodosLosFiltros = () => {
    setQuery('')
    setNivelActivo(null)
    setOrigenActivo('todos')
    setCurrentPage(1)
    setDirection(0)
    searchInputRef.current?.focus()
  }

  const tieneFiltrosActivos = query !== '' || nivelActivo !== null || origenActivo !== 'todos'

  const activeLabel = useMemo(() => {
    if (nivelActivo !== null) {
      const levelObj = nivelesConConteo.find(n => n.nivel === nivelActivo)
      return levelObj ? levelObj.nombre : `Nivel ${nivelActivo}`
    }
    if (origenActivo === 'termino') return 'Jerga de Trinchera'
    if (origenActivo === 'nodo') return 'Nodos de Rumbo'
    return 'Catálogo Completo'
  }, [nivelActivo, origenActivo, nivelesConConteo])

  return (
    <section id="catalogo" ref={catalogTopRef} className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pb-32 scroll-mt-24">
      
      {/* 1. BUSCADOR SPOTLIGHT */}
      <div id="buscar" className="scroll-mt-28 mb-5 max-w-2xl mx-auto">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por término, definición o vendor (ej: XCom, grano, backpressure, Spark)..."
            className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-white/10 bg-[#121212]/90 text-xs sm:text-sm font-mono text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all backdrop-blur-md shadow-lg"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {query ? (
              <button
                onClick={() => {
                  setQuery('')
                  searchInputRef.current?.focus()
                }}
                className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Limpiar búsqueda (Esc)"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 rounded">
                /
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* 2. TOOLBAR DE FILTROS // Mismo lenguaje visual del panel de Rumbo (RoadmapGraphView) */}
      <div className="mb-6 rounded-2xl border border-neutral-800/90 bg-neutral-950 shadow-2xl overflow-hidden font-mono">
        {/* Fila 1: badge de contexto + selector de origen segmentado */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-emerald-400">
              <Filter size={13} />
              <span className="font-semibold uppercase">Catálogo // Filtros</span>
            </div>
            <span className="text-neutral-500 text-[11px] hidden md:inline">
              {terminos.length} conceptos indexados
            </span>
          </div>

          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
            <button
              onClick={() => {
                setNivelActivo(null)
                setOrigenActivo('todos')
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                nivelActivo === null && origenActivo === 'todos'
                  ? 'bg-neutral-800 text-emerald-400'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Sparkles size={11} />
              <span>Todos</span>
              <span className="text-[10px] opacity-70">{terminos.length}</span>
            </button>
            <button
              onClick={() => {
                setNivelActivo(null)
                setOrigenActivo('termino')
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                origenActivo === 'termino'
                  ? 'bg-neutral-800 text-emerald-400'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Zap size={11} />
              <span>Trinchera</span>
              <span className="text-[10px] opacity-70">{curadosCount}</span>
            </button>
            <button
              onClick={() => {
                setNivelActivo(null)
                setOrigenActivo('nodo')
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                origenActivo === 'nodo'
                  ? 'bg-neutral-800 text-emerald-400'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Compass size={11} />
              <span>Rumbo</span>
              <span className="text-[10px] opacity-70">{nodosCount}</span>
            </button>
          </div>
        </div>

        {/* Fila 2: niveles pedagógicos, franja horizontal con scroll */}
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none">
          {nivelesConConteo.map((n) => {
            const Icon = n.Icon
            const isActive = nivelActivo === n.nivel

            return (
              <button
                key={n.nivel}
                onClick={() => {
                  setNivelActivo(isActive ? null : n.nivel)
                  setOrigenActivo('todos')
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] shrink-0 transition-colors ${
                  isActive
                    ? 'bg-neutral-800 border-white/10 text-emerald-400'
                    : 'border-transparent text-neutral-500 hover:text-white hover:bg-neutral-900'
                }`}
                title={`${n.nombre} (${n.count} conceptos)`}
              >
                <Icon className="size-[11px]" />
                <span>{n.nombre}</span>
                <span className="text-[10px] opacity-70">{n.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Feedback visual sutil debajo de la toolbar */}
      <div className="mb-6 -mt-2 flex items-center justify-center gap-2 text-xs font-mono text-neutral-400">
        <span className="size-1 rounded-full bg-white/80" />
        <span>Filtro: <strong className="text-neutral-100 font-medium">{activeLabel}</strong></span>
        {tieneFiltrosActivos && (
          <button
            onClick={limpiarTodosLosFiltros}
            className="ml-2 text-neutral-400 hover:text-white underline-offset-4 hover:underline inline-flex items-center gap-1 text-[11px] transition-colors"
          >
            <RotateCcw size={10} />
            <span>Ver todos</span>
          </button>
        )}
      </div>

      {/* 3. SUB-HEADER // Telemetría de Resultados */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-2">
          <span>
            Mostrando{' '}
            <strong className="text-white">
              {filtrados.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
            </strong>{' '}
            -{' '}
            <strong className="text-white">
              {Math.min(currentPage * ITEMS_PER_PAGE, filtrados.length)}
            </strong>{' '}
            de <strong className="text-white">{filtrados.length}</strong> conceptos
          </span>
        </div>
      </div>

      {/* 4. ESTADO VACÍO // No se encontraron resultados */}
      {filtrados.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-2xl border border-dashed border-white/10 bg-[#121212]/50 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="mx-auto size-12 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-400">
            <Search size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white font-mono uppercase tracking-tight">
              Sin coincidencias en el catálogo
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              No se encontró ningún término que coincida con tus criterios actuales de búsqueda y categoría.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={limpiarTodosLosFiltros}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-neutral-950 font-mono text-xs font-semibold hover:bg-neutral-200 transition-colors shadow-lg"
            >
              <RotateCcw size={12} />
              <span>Ver todos los {terminos.length} términos</span>
            </button>
          </div>
        </div>
      ) : (
        /* 5. GRID DE 6 FICHAS POR PÁGINA */
        <div className="space-y-8 min-h-[560px]">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={`page-${currentPage}-${nivelActivo}-${origenActivo}-${query}`}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid grid-cols-1 lg:grid-cols-2 gap-5"
            >
              {paginatedTerminos.map(t => {
                const isHighlighted = activeHash === t.slug
                const isCopied = copiedSlug === t.slug

                return (
                  <CardCurtainReveal
                    key={t.slug}
                    id={t.slug}
                    className={`scroll-mt-28 h-[420px] rounded-2xl border transition-all duration-300 ${
                      isHighlighted
                        ? 'border-white/40 bg-neutral-900/95 shadow-[0_0_35px_rgba(255,255,255,0.1)] ring-1 ring-white/30'
                        : 'border-white/10 bg-[#121212]/80 hover:border-white/20 hover:bg-[#141414] shadow-lg'
                    }`}
                  >
                    {/* Indicador de Resaltado Dinámico en el Borde Superior */}
                    {isHighlighted && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/80 to-transparent z-20" />
                    )}

                    <CardCurtainRevealBody className="relative z-20 flex flex-col h-full p-5 sm:p-6">
                      {/* Cabecera de la Tarjeta: Badges + Botón de Copiar Enlace (siempre visible, como el meta de ArticleCard) */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Badge de Origen */}
                          {t.origen === 'termino' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900 border border-white/10 text-[10px] font-mono text-neutral-300 font-medium">
                              <Zap size={10} className="text-neutral-400" />
                              <span>TRINCHERA</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900 border border-white/10 text-[10px] font-mono text-neutral-300 font-medium">
                              <Compass size={10} className="text-neutral-400" />
                              <span>RUMBO</span>
                            </span>
                          )}

                          {/* Badge de Nivel */}
                          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-white/5">
                            NIVEL {t.nivel} · {niveles[t.nivel] ?? t.nivel_nombre}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Cruce con Rumbo */}
                          {t.origen === 'nodo' && (
                            <Link
                              href="/ruta"
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
                              title="Ver este nodo en el grafo de Rumbo"
                            >
                              <span>Ver en Rumbo</span>
                              <ChevronRight size={11} />
                            </Link>
                          )}

                          {/* Botón Copiar Enlace Permanente */}
                          <button
                            onClick={() => handleCopyLink(t.slug, t.termino)}
                            className={`p-1.5 rounded-lg border text-neutral-400 transition-all ${
                              isCopied
                                ? 'border-white/30 bg-neutral-800 text-white'
                                : 'border-white/5 bg-neutral-900/60 hover:text-white hover:border-white/20'
                            }`}
                            title={`Copiar enlace permanente a "${t.termino}"`}
                          >
                            {isCopied ? <Check size={12} className="text-white" /> : <Link2 size={12} />}
                          </button>
                        </div>
                      </div>

                      {/* Nombre del Término — oculto hasta hover, igual que el título de ArticleCard */}
                      <CardCurtainRevealTitle className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                        {t.termino}
                      </CardCurtainRevealTitle>

                      {/* Definición + Bitácora — ocultas hasta hover, igual que la descripción de ArticleCard */}
                      <CardCurtainRevealDescription className="my-4 space-y-3.5">
                        <p className="text-sm text-neutral-300 font-sans font-light leading-relaxed line-clamp-4">
                          {t.definicion}
                        </p>

                        {t.uso_texto && (
                          <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-3.5 space-y-1.5 text-xs font-mono">
                            <div className="flex items-center justify-between text-[10px] text-neutral-400">
                              <span className="flex items-center gap-1.5 text-neutral-200 font-semibold">
                                <Terminal size={11} className="text-neutral-400" />
                                <span>// DÓNDE SE USÓ EN ESTE PROYECTO</span>
                              </span>
                              {t.uso_link && (
                                <a
                                  href={t.uso_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-neutral-300 hover:text-white transition-colors underline-offset-4 hover:underline"
                                >
                                  <span>Ver evidencia</span>
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                            <p className="text-neutral-300 font-sans text-xs leading-relaxed line-clamp-3">
                              {t.uso_texto}
                            </p>
                          </div>
                        )}
                      </CardCurtainRevealDescription>

                      {/* Fuentes Primarias Verificadas — siempre visible y pegada abajo, como el CTA de ArticleCard */}
                      {t.fuentes && t.fuentes.length > 0 && (
                        <div className="mt-auto pt-3 border-t border-white/5 flex flex-col gap-2">
                          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck size={10} className="text-neutral-400" />
                            <span>Fuente oficial primaria verificada</span>
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {t.fuentes.slice(0, 3).map(f => {
                              const host = extractHostname(f.url)
                              return (
                                <a
                                  key={f.url}
                                  href={f.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/5 bg-neutral-900/80 hover:bg-neutral-800 hover:border-white/20 text-[11px] font-mono text-neutral-300 transition-all"
                                  title={f.por_que}
                                >
                                  <ExternalLink size={10} className="text-neutral-500 group-hover:text-white transition-colors" />
                                  <span className="group-hover:text-white transition-colors">{host}</span>
                                  {f.por_que && (
                                    <span className="text-[10px] text-neutral-500 hidden xl:inline max-w-[280px] truncate border-l border-neutral-800 pl-1.5 ml-0.5">
                                      {f.por_que}
                                    </span>
                                  )}
                                </a>
                              )
                            })}
                            {t.fuentes.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-mono text-neutral-500">
                                +{t.fuentes.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Curtain: la cortina que barre e invierte los colores al hover, cubre toda la tarjeta */}
                      <CardCurtain className="bg-neutral-100" />
                    </CardCurtainRevealBody>
                  </CardCurtainReveal>
                )
              })}
            </motion.div>
          </AnimatePresence>

          {/* 6. BARRA DE PAGINACIÓN HUD INTERACTIVA */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Telemetría */}
              <div className="text-xs font-mono text-neutral-500 flex items-center gap-2">
                <span>Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong></span>
                <span className="hidden md:inline text-neutral-600">·</span>
                <span className="hidden md:inline text-neutral-500">Usa las teclas <kbd className="px-1 py-0.5 rounded bg-neutral-900 border border-white/10 text-[10px] text-neutral-400">←</kbd> y <kbd className="px-1 py-0.5 rounded bg-neutral-900 border border-white/10 text-[10px] text-neutral-400">→</kbd></span>
              </div>

              {/* Controles de Paginación */}
              <div className="flex items-center gap-1.5 bg-[#121212]/95 border border-white/10 p-1.5 rounded-xl shadow-inner select-none font-mono">
                
                {/* Botón Anterior */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentPage === 1
                      ? 'text-neutral-600 opacity-40 cursor-not-allowed'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer'
                  }`}
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={14} />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                {/* Píldoras Numéricas */}
                <div className="flex items-center gap-1 px-1">
                  {(() => {
                    const getVisiblePages = () => {
                      if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
                      if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages]
                      if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
                      return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
                    }

                    return getVisiblePages().map((pageNum, idx) => {
                      if (pageNum === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="w-6 text-center text-neutral-600 select-none">
                            &hellip;
                          </span>
                        )
                      }

                      const num = pageNum as number
                      const isActive = currentPage === num

                      return (
                        <button
                          key={num}
                          onClick={() => handlePageChange(num)}
                          className={`relative size-8 rounded-lg text-xs font-mono transition-colors flex items-center justify-center cursor-pointer ${
                            isActive ? 'text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-pagination-number-pill"
                              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                              className="absolute inset-0 bg-white rounded-lg -z-10 shadow-sm"
                            />
                          )}
                          <span>{num}</span>
                        </button>
                      )
                    })
                  })()}
                </div>

                {/* Botón Siguiente */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentPage === totalPages
                      ? 'text-neutral-600 opacity-40 cursor-not-allowed'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer'
                  }`}
                  aria-label="Página siguiente"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
