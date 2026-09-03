'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Terminal as TerminalIcon, 
  GitCommit, 
  Layers, 
  CheckCircle2, 
  ExternalLink, 
  ArrowDown,
  ShieldAlert,
  GitBranch,
  Sparkles
} from 'lucide-react';

const INCIDENTS = [
  {
    id: 'parse_releases.py',
    name: 'parse_releases.py',
    nodeNum: '02.1',
    nodeName: 'Ingesta Desacoplada',
    concept: 'Manejo de Errores vs Descarte Silencioso',
    tool: 'Python (Worker)',
    commit: 'a8f3f85',
    commitUrl: 'https://github.com/JeanArdila711/data-engineering/commit/a8f3f85',
    lesson: 'Un descarte silencioso es peor que un except: la corrida terminaba en verde engañoso sin datos.',
    diff: [
      { type: 'context', num: '54', text: '    for release in raw_releases:' },
      { type: 'remove',  num: '55', text: '-       if not release.version or not release.date:' },
      { type: 'remove',  num: '56', text: '-           continue  # Silencioso: omitía sin log' },
      { type: 'add',     num: '55', text: '+       if not release.version or not release.date:' },
      { type: 'add',     num: '56', text: '+           logger.warning("invalid_release", raw=release.tag)' },
      { type: 'add',     num: '57', text: '+           quarantine.append(release)  # Con rastro' },
      { type: 'context', num: '58', text: '        yield process_valid_release(release)' },
    ],
  },
  {
    id: 'upsert_releases.sql',
    name: 'upsert_idempotente.sql',
    nodeNum: '02.3',
    nodeName: 'Idempotencia',
    concept: 'Idempotencia en Pipelines Batch',
    tool: 'PostgreSQL / SQL',
    commit: 'e41b092',
    commitUrl: 'https://github.com/JeanArdila711/data-engineering/blob/main/README.md',
    lesson: 'Correr el pipeline 2 veces debe dejar el mismo estado. Sin idempotencia, un retry duplica el mart.',
    diff: [
      { type: 'context', num: '12', text: '  -- Carga incremental de releases ingeridos' },
      { type: 'remove',  num: '13', text: '- INSERT INTO mart_releases (tool_id, version, date)' },
      { type: 'remove',  num: '14', text: '- VALUES ($1, $2, $3);  -- Duplica en reintentos' },
      { type: 'add',     num: '13', text: '+ INSERT INTO mart_releases (tool_id, version, date)' },
      { type: 'add',     num: '14', text: '+ VALUES ($1, $2, $3)' },
      { type: 'add',     num: '15', text: '+ ON CONFLICT (tool_id, version) DO UPDATE' },
      { type: 'add',     num: '16', text: '+ SET updated_at = NOW();  -- Idempotente' },
    ],
  },
  {
    id: 'dim_tools_scd2.sql',
    name: 'dim_tools_scd2.sql',
    nodeNum: '05.2',
    nodeName: 'Modelado Dimensional',
    concept: 'Historización SCD Tipo 2',
    tool: 'dbt / DuckDB',
    commit: '3f7c81a',
    commitUrl: 'https://github.com/JeanArdila711/data-engineering/blob/main/README.md',
    lesson: 'Si sobreescribes la dimensión (SCD1), pierdes qué versión era tier-1 el mes pasado.',
    diff: [
      { type: 'context', num: '28', text: '  -- Cambio de clasificación de herramienta' },
      { type: 'remove',  num: '29', text: '- UPDATE dim_tools SET tier = \'tier_1\' WHERE slug = \'duckdb\';' },
      { type: 'remove',  num: '30', text: '- -- Destruye el histórico: sobreescritura pura' },
      { type: 'add',     num: '29', text: '+ UPDATE dim_tools SET valid_to = NOW(), is_current = FALSE' },
      { type: 'add',     num: '30', text: '+ WHERE slug = \'duckdb\' AND is_current = TRUE;' },
      { type: 'add',     num: '31', text: '+ INSERT INTO dim_tools (tool_id, tier, valid_from, is_current)' },
      { type: 'add',     num: '32', text: '+ VALUES (\'duckdb\', \'tier_1\', NOW(), TRUE);' },
    ],
  },
];

export default function RoadmapHero() {
  const [activeTab, setActiveTab] = useState(0);
  const currentIncident = INCIDENTS[activeTab];

  return (
    <section className="w-full max-w-6xl mx-auto px-5 md:px-6 pt-28 md:pt-36 pb-12 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        
        {/* Lado Izquierdo: Titular y Manifiesto de Rumbo */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-[11px] font-mono text-emerald-400 w-fit backdrop-blur-sm shadow-[0_0_16px_rgba(52,211,153,0.08)]">
            <Compass size={13} className="text-emerald-400 animate-[spin_12s_linear_infinite]" />
            <span>[05] // RUMBO · GRAFO TÉCNICO DE APRENDIZAJE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tighter text-white uppercase leading-[1.08] text-balance">
            Aprende Conceptos, <br className="hidden sm:inline" />
            No Modas de Herramientas.
          </h1>

          <p className="text-neutral-400 text-sm sm:text-base font-light leading-relaxed max-w-xl">
            Orquestación o modelado dimensional son los conceptos; Airflow, dbt o DuckDB son formas de practicarlos.
            Rumbo organiza <strong className="font-medium text-neutral-200">34 nodos en un grafo topológico dependiente</strong>, 
            conectado en tiempo real al pipeline de releases y respaldado por fallos reales en producción.
          </p>

          {/* Atajos de navegación rápidos */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#armar"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/50 bg-emerald-950/20 text-emerald-400 text-xs font-mono font-medium hover:bg-emerald-950/40 hover:border-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.12)]"
            >
              <span>Personalizar mi ruta</span>
              <ArrowDown size={13} />
            </a>
            <a
              href="#rumbo"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950/60 text-neutral-400 text-xs font-mono hover:text-white hover:border-neutral-700 transition-colors"
            >
              <span>Explorar 34 nodos</span>
              <ArrowDown size={13} />
            </a>
          </div>

          {/* Tira de telemetría compacta */}
          <div className="pt-4 border-t border-neutral-800/60 flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-neutral-300 font-normal">34 Nodos</strong> en DAG
            </span>
            <span>·</span>
            <span><strong className="text-neutral-300 font-normal">18 Casos</strong> &quot;Lo vi romperse&quot;</span>
            <span>·</span>
            <span><strong className="text-neutral-300 font-normal">100%</strong> Datos en Vivo</span>
          </div>
        </div>

        {/* Lado Derecho: La Caja Negra de Producción (Git Diff Interactivo) */}
        <div className="lg:col-span-6">
          <div className="rounded-2xl border border-neutral-800/90 bg-neutral-950/95 shadow-2xl overflow-hidden font-mono text-xs flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.6)]">
            
            {/* 1. Header de ventana con Pestañas Interactivas (Opción 1 + 3) */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-red-500/80" />
                  <div className="size-2.5 rounded-full bg-amber-500/80" />
                  <div className="size-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] ml-2">
                  <GitBranch size={12} className="text-neutral-500" />
                  <span>main // postmortem</span>
                </div>
              </div>

              <div className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950/50 border border-amber-800/40 text-amber-400 flex items-center gap-1">
                <ShieldAlert size={11} />
                <span>Lo Vi Romperse</span>
              </div>
            </div>

            {/* Selector de Pestañas de Incidentes */}
            <div className="flex border-b border-neutral-800 bg-neutral-950 overflow-x-auto scrollbar-none relative">
              {INCIDENTS.map((inc, index) => {
                const isActive = activeTab === index;
                return (
                  <button
                    key={inc.id}
                    onClick={() => setActiveTab(index)}
                    className="relative px-3.5 py-2.5 text-[11px] font-mono border-r border-neutral-800/80 transition-colors flex items-center gap-1.5 whitespace-nowrap select-none group"
                  >
                    {/* Active tab sliding highlight */}
                    {isActive && (
                      <motion.div
                        layoutId="active-incident-tab"
                        className="absolute inset-0 bg-neutral-900/90 border-b-2 border-emerald-400 z-0"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <GitCommit
                        size={12}
                        className={isActive ? 'text-emerald-400' : 'text-neutral-600 group-hover:text-neutral-400 transition-colors'}
                      />
                      <span
                        className={isActive ? 'text-emerald-400 font-semibold' : 'text-neutral-500 group-hover:text-neutral-300 transition-colors'}
                      >
                        {inc.name}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Contenedor Animado de Diff con altura estable y transición cinemática */}
            <div className="relative overflow-hidden min-h-[350px] flex flex-col justify-between">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentIncident.id}
                  initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col flex-1 justify-between"
                >
                  {/* 2. Metadata Bar: Concepto vs Herramienta */}
                  <div className="px-4 py-2 bg-neutral-900/40 border-b border-neutral-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">Concepto:</span>
                      <span className="text-neutral-200 font-sans font-medium">{currentIncident.concept}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">Tool:</span>
                      <span className="px-2 py-0.5 rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300 text-[10px]">
                        {currentIncident.tool}
                      </span>
                      {currentIncident.commitUrl && (
                        <a
                          href={currentIncident.commitUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-400/80 hover:text-emerald-300 flex items-center gap-0.5 underline-offset-2 hover:underline ml-1"
                        >
                          <span>{currentIncident.commit}</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 3. Visor de Diff (Rojo = Fallo en Prod / Verde = Fix de Ingeniería) */}
                  <div className="p-3 sm:p-4 font-mono text-[11px] sm:text-xs leading-relaxed overflow-x-auto space-y-0.5 bg-black/70 flex-1 min-h-[195px]">
                    {currentIncident.diff.map((line, idx) => {
                      if (line.type === 'remove') {
                        return (
                          <div key={idx} className="flex gap-2.5 bg-red-950/30 text-red-300 -mx-3 sm:-mx-4 px-3 sm:px-4 py-0.5 border-l-2 border-red-500/80 font-mono">
                            <span className="text-neutral-600 select-none w-5 text-right shrink-0">{line.num}</span>
                            <span className="select-none text-red-400">-</span>
                            <span className="break-all">{line.text.slice(2)}</span>
                          </div>
                        );
                      }
                      if (line.type === 'add') {
                        return (
                          <div key={idx} className="flex gap-2.5 bg-emerald-950/30 text-emerald-300 -mx-3 sm:-mx-4 px-3 sm:px-4 py-0.5 border-l-2 border-emerald-500/80 font-mono">
                            <span className="text-neutral-600 select-none w-5 text-right shrink-0">{line.num}</span>
                            <span className="select-none text-emerald-400">+</span>
                            <span className="break-all">{line.text.slice(2)}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="flex gap-2.5 text-neutral-500 px-3 sm:px-4 py-0.5 font-mono">
                          <span className="text-neutral-700 select-none w-5 text-right shrink-0">{line.num}</span>
                          <span className="select-none text-neutral-700">&nbsp;</span>
                          <span className="break-all">{line.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* 4. Footer de Telemetría: Lección Real & Estado de Grafo */}
                  <div className="px-4 py-2.5 bg-neutral-900/80 border-t border-neutral-800 flex flex-col gap-1.5 text-[11px]">
                    <div className="flex items-start gap-2 text-neutral-400">
                      <span className="text-amber-400 font-semibold shrink-0">Bitácora:</span>
                      <span className="font-sans text-xs text-neutral-300 font-light leading-snug">
                        {currentIncident.lesson}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-500">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                        <CheckCircle2 size={11} />
                        <span>Kahn DAG Verified · Nodo {currentIncident.nodeNum}</span>
                      </div>
                      <a
                        href={`#rumbo`}
                        className="hover:text-neutral-300 transition-colors inline-flex items-center gap-1 font-mono text-neutral-400"
                      >
                        <span>Ver en el grafo</span>
                        <ArrowDown size={10} />
                      </a>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
