'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  Terminal, 
  Sparkles,
  Search,
  ChevronRight,
  Database,
  Layers,
  Cpu
} from 'lucide-react'
import { RevealButton } from '@/components/ui/reveal-button'

interface SpecInspectionItem {
  id: string
  slug: string
  name: string
  domain: string
  levelNum: string
  levelName: string
  tool: string
  sourceHost: string
  sourceUrl: string
  sourceWhy: string
  quote: string
  deRadarLesson: string
  icon: typeof Database
}

const SPEC_ITEMS: SpecInspectionItem[] = [
  {
    id: 'predicate-pushdown',
    slug: 'predicate-pushdown',
    name: 'Predicate pushdown',
    domain: 'Formatos Columnares & Parquet',
    levelNum: '03',
    levelName: 'Formatos Columnares',
    tool: 'Apache Spark & Parquet',
    sourceHost: 'spark.apache.org',
    sourceUrl: 'https://spark.apache.org/docs/latest/sql-data-sources-parquet.html',
    sourceWhy: 'Documentación oficial de Spark con flag activo desde versión 1.2',
    quote:
      'Empuja los filtros de una consulta hasta el lector columnar del archivo, descartando row groups enteros en disco antes de transferir bytes a memoria RAM.',
    deRadarLesson:
      'Decisión 15: Filtro determinista previo al LLM. La misma regla de oro: descartar el 90% antes de pagar el recurso caro (en disco, I/O; en pipelines, llamadas al modelo).',
    icon: Database,
  },
  {
    id: 'xcom',
    slug: 'xcom',
    name: 'XCom (Cross-Communication)',
    domain: 'Orquestación de Pipelines',
    levelNum: '06',
    levelName: 'Orquestación',
    tool: 'Apache Airflow 2.10+',
    sourceHost: 'airflow.apache.org',
    sourceUrl: 'https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/xcoms.html',
    sourceWhy: 'Documentación oficial advirtiendo explícitamente sobre el límite de tamaño en metadatos',
    quote:
      'Mecanismo para pasar metadatos pequeños (IDs, conteos, paths) entre tareas. Vive en la base transaccional del scheduler; no está diseñado para mover DataFrames ni volúmenes de datos.',
    deRadarLesson:
      'Decisión 6 y 11: Orquestación con GitHub Actions y persistencia en Postgres. El estado del pipeline vive en tablas normalizadas, nunca en la memoria del orquestador.',
    icon: Cpu,
  },
  {
    id: 'time-travel',
    slug: 'time-travel',
    name: 'Time travel',
    domain: 'Open Table Formats & Lakehouse',
    levelNum: '03',
    levelName: 'Table Formats',
    tool: 'Apache Iceberg v2 Spec',
    sourceHost: 'iceberg.apache.org',
    sourceUrl: 'https://iceberg.apache.org/docs/latest/spark-queries/#time-travel',
    sourceWhy: 'Especificación técnica de Iceberg sobre snapshots inmutables y logs de manifiestos',
    quote:
      'Capacidad de consultar el estado histórico de una tabla en un timestamp o snapshot exacto sin duplicar particiones, navegando árboles inmutables de archivos de metadatos.',
    deRadarLesson:
      'Decisión 1: Idempotencia y reproducibilidad histórica. Cada corrida del pipeline es determinista: reproducir el pasado exige inmutabilidad en los orígenes.',
    icon: Layers,
  },
]

interface GlosarioHeroProps {
  totalTerminos: number
  curadosCount: number
  nodosCount: number
  nivelesCount: number
}

export default function GlosarioHero({
  totalTerminos,
  curadosCount,
  nodosCount,
  nivelesCount,
}: GlosarioHeroProps) {
  const [activeTab, setActiveTab] = useState(0)
  const currentItem = SPEC_ITEMS[activeTab]

  return (
    <header className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-8">
      {/* 1. Breadcrumb técnico */}
      <nav aria-label="Breadcrumb" className="mb-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-neutral-500">
        <Link href="/" className="hover:text-neutral-300 transition-colors">
          Inicio
        </Link>
        <ChevronRight size={11} className="text-neutral-700 shrink-0" />
        <span className="text-neutral-300">Glosario</span>
        <ChevronRight size={11} className="text-neutral-700 shrink-0" />
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-medium">
          <span className="size-1 rounded-full bg-emerald-400" />
          53 Entradas Verificadas
        </span>
      </nav>

      {/* 2. Cinta superior de telemetría HUD */}
      <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-mono text-neutral-400 border-b border-neutral-800/80 pb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-emerald-400 font-semibold">
          <BookOpen size={12} className="text-emerald-400" />
          <span>[06] // GLOSARIO · REGLA DE DOS FILTROS</span>
        </div>
        <span className="text-neutral-700 select-none">·</span>
        <span className="text-neutral-400">
          CATÁLOGO: <strong className="text-neutral-200 font-normal">{totalTerminos} TÉRMINOS EN TOTAL</strong>
        </span>
        <span className="text-neutral-700 select-none hidden sm:inline">·</span>
        <span className="text-neutral-400 hidden sm:inline">
          CATEGORÍAS: <strong className="text-neutral-200 font-normal">{nivelesCount} NIVELES</strong>
        </span>
        <span className="text-neutral-700 select-none hidden md:inline">·</span>
        <span className="text-emerald-400/90 hidden md:inline">
          100% CITACIÓN PRIMARIA
        </span>
      </div>

      {/* 3. Distribución 60/40: Titular & Manifiesto + Inspector de Fuente Primaria */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-10 items-start">
        {/* Columna Izquierda */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.85rem] font-extrabold tracking-tight text-white uppercase leading-[1.08] text-balance">
              Jerga Real de Trinchera, <br className="hidden sm:inline" />
              Cero Definiciones de Memoria.
            </h1>
            <p className="mt-3.5 text-neutral-400 text-sm sm:text-base font-light leading-relaxed max-w-2xl">
              Conceptos técnicos de Data Engineering que no se explican con analogías vagas ni prosa de manual.
              Cada término supera dos filtros de curación: <strong className="font-medium text-neutral-200">evidencia de uso en el ecosistema real</strong> y <strong className="font-medium text-neutral-200">verificación contra documentación oficial primaria</strong>.
            </p>
          </div>

          {/* Bento Chips de Telemetría */}
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
            <div className="px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-300 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span><strong className="text-white font-medium">{totalTerminos}</strong> Verificados</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-300 flex items-center gap-2">
              <span className="text-cyan-400">⚡</span>
              <span><strong className="text-white font-medium">{curadosCount}</strong> Jerga de Trinchera</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-300 flex items-center gap-2">
              <span className="text-emerald-400">✦</span>
              <span><strong className="text-white font-medium">{nodosCount}</strong> Nodos de Rumbo</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-300 flex items-center gap-2 hidden sm:flex">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>Sin Alucinaciones IA</span>
            </div>
          </div>

          {/* Fila de Acciones */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <RevealButton href="#catalogo" size="sm" className="shadow-[0_0_24px_rgba(255,255,255,0.12)]">
              Explorar los {totalTerminos} términos
            </RevealButton>
            <a
              href="#buscar"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-950/70 text-xs font-mono text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
            >
              <Search size={12} className="text-neutral-500" />
              <span>Buscar término</span>
              <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">
                /
              </kbd>
            </a>
            <Link
              href="/ruta"
              className="text-xs font-mono text-neutral-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 underline-offset-4 hover:underline ml-1"
            >
              <span>Ver grafo en Rumbo</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Columna Derecha: The Primary Source Inspector */}
        <div className="w-full">
          <div className="rounded-2xl border border-neutral-800/90 bg-neutral-950/95 shadow-2xl overflow-hidden font-mono text-xs flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.7)] backdrop-blur-md">
            
            {/* Header de la Terminal Inspector */}
            <div className="flex flex-wrap items-center justify-between px-3.5 sm:px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800/80 gap-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-red-500/70" />
                  <div className="size-2.5 rounded-full bg-amber-500/70" />
                  <div className="size-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <span className="text-[11px] text-neutral-400 font-sans font-medium flex items-center gap-1.5 ml-1">
                  <Terminal size={12} className="text-emerald-400" />
                  <span>primary-source-inspector.sh</span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                <CheckCircle2 size={10} />
                <span>SPEC VERIFIED</span>
              </div>
            </div>

            {/* Pestañas de Selección de Término */}
            <div className="flex border-b border-neutral-800/70 bg-black/40 overflow-x-auto scrollbar-none">
              {SPEC_ITEMS.map((item, idx) => {
                const isActive = activeTab === idx
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(idx)}
                    className={`px-3.5 py-2 text-[11px] border-r border-neutral-800/70 transition-all flex items-center gap-1.5 shrink-0 select-none ${
                      isActive
                        ? 'bg-neutral-900 text-white font-medium border-b-2 border-b-emerald-400'
                        : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/40'
                    }`}
                  >
                    <item.icon size={11} className={isActive ? 'text-emerald-400' : 'text-neutral-600'} />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Cuerpo del Inspector */}
            <div className="p-4 sm:p-5 flex flex-col gap-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  {/* Metadata Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pb-2 border-b border-neutral-800/60">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">DOMINIO:</span>
                      <span className="text-neutral-200 font-medium">{currentItem.domain}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-500">ORIGEN:</span>
                      <span className="text-emerald-400 font-medium bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/30">
                        {currentItem.tool}
                      </span>
                    </div>
                  </div>

                  {/* Cita Oficial Primaria */}
                  <div className="rounded-xl border border-neutral-800 bg-black/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <span>❝</span>
                        <span>ESPECIFICACIÓN PRIMARIA VERIFICADA</span>
                      </span>
                      <a
                        href={currentItem.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
                      >
                        <span>{currentItem.sourceHost}</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                    <p className="text-[12px] text-neutral-200 leading-relaxed font-sans font-normal italic">
                      &quot;{currentItem.quote}&quot;
                    </p>
                    <p className="text-[10px] text-neutral-500 pt-0.5">
                      ↳ {currentItem.sourceWhy}
                    </p>
                  </div>

                  {/* Bloque Bitácora: En DE Radar */}
                  <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3 space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[10px]">
                      <Terminal size={11} />
                      <span>// DÓNDE SE APLICA EN DE RADAR</span>
                    </div>
                    <p className="text-neutral-300 leading-relaxed font-sans">
                      {currentItem.deRadarLesson}
                    </p>
                  </div>

                  {/* Footer del inspector */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-500">
                    <span className="text-[10px]">
                      NIVEL {currentItem.levelNum} · {currentItem.levelName}
                    </span>
                    <a
                      href={`#${currentItem.slug}`}
                      className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                      <span>Ver ficha en catálogo</span>
                      <ChevronRight size={11} />
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
