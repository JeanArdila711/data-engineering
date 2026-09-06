'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCode2, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Database,
  Workflow,
  ArrowRight,
  Terminal,
  Activity
} from 'lucide-react';

interface DimensionalStudioProps {
  objetivoSlug: string;
}

export default function DimensionalStudio({ objetivoSlug }: DimensionalStudioProps) {
  const [activeTab, setActiveTab] = useState<'model' | 'schema' | 'tests'>('model');

  // Si no es modelado analítico, adaptamos la metadata y el contenido
  const isModelado = objetivoSlug === 'modelado-analitico';
  const isBatch = objetivoSlug === 'pipelines-batch';
  const isStreaming = objetivoSlug === 'streaming';
  const isCloud = objetivoSlug === 'plataforma-cloud';

  const windowTitle = isModelado 
    ? 'dbt-core // mart_changelog.sql' 
    : isBatch 
    ? 'pipeline // upsert_idempotente.sql'
    : isStreaming
    ? 'stream // kafka_consumer.py'
    : isCloud
    ? 'terraform // storage_capacity.tf'
    : 'engine // kahn_dag_sort.py';

  const windowBadge = isModelado
    ? 'SCD2 Range Join'
    : isBatch
    ? 'Idempotent ELT'
    : isStreaming
    ? 'At-Least-Once'
    : isCloud
    ? 'Vendor-Agnostic'
    : 'Topological DAG';

  return (
    <div className="rounded-2xl border border-neutral-800/90 bg-neutral-950/95 shadow-2xl overflow-hidden font-mono text-xs flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.6)]">
      
      {/* 1. Header de Ventana macOS */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-red-500/80" />
            <div className="size-2.5 rounded-full bg-amber-500/80" />
            <div className="size-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] ml-2">
            <Terminal size={12} className="text-cyan-400" />
            <span className="text-neutral-300 font-medium">{windowTitle}</span>
          </div>
        </div>

        <div className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-400 flex items-center gap-1">
          <Sparkles size={11} />
          <span>{windowBadge}</span>
        </div>
      </div>

      {/* 2. Selector de Pestañas Interactivas */}
      <div className="flex border-b border-neutral-800 bg-neutral-950 overflow-x-auto scrollbar-none relative">
        <button
          onClick={() => setActiveTab('model')}
          className="relative px-3.5 py-2.5 text-[11px] font-mono border-r border-neutral-800/80 transition-colors flex items-center gap-1.5 select-none group"
        >
          {activeTab === 'model' && (
            <motion.div
              layoutId="active-studio-tab"
              className="absolute inset-0 bg-neutral-900/90 border-b-2 border-cyan-400 z-0"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <FileCode2 size={12} className={activeTab === 'model' ? 'text-cyan-400' : 'text-neutral-600'} />
            <span className={activeTab === 'model' ? 'text-cyan-300 font-semibold' : 'text-neutral-400 group-hover:text-neutral-200'}>
              {isModelado ? 'dbt Model' : isBatch ? 'SQL Idempotente' : 'Código Core'}
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className="relative px-3.5 py-2.5 text-[11px] font-mono border-r border-neutral-800/80 transition-colors flex items-center gap-1.5 select-none group"
        >
          {activeTab === 'schema' && (
            <motion.div
              layoutId="active-studio-tab"
              className="absolute inset-0 bg-neutral-900/90 border-b-2 border-cyan-400 z-0"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <Layers size={12} className={activeTab === 'schema' ? 'text-cyan-400' : 'text-neutral-600'} />
            <span className={activeTab === 'schema' ? 'text-cyan-300 font-semibold' : 'text-neutral-400 group-hover:text-neutral-200'}>
              {isModelado ? 'Star Schema' : isBatch ? 'Pipeline Flow' : 'Topología'}
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className="relative px-3.5 py-2.5 text-[11px] font-mono border-r border-neutral-800/80 transition-colors flex items-center gap-1.5 select-none group"
        >
          {activeTab === 'tests' && (
            <motion.div
              layoutId="active-studio-tab"
              className="absolute inset-0 bg-neutral-900/90 border-b-2 border-cyan-400 z-0"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <ShieldCheck size={12} className={activeTab === 'tests' ? 'text-cyan-400' : 'text-neutral-600'} />
            <span className={activeTab === 'tests' ? 'text-cyan-300 font-semibold' : 'text-neutral-400 group-hover:text-neutral-200'}>
              dbt Tests (QA)
            </span>
          </span>
        </button>
      </div>

      {/* 3. Contenedor de Vista Animada */}
      <div className="relative overflow-hidden min-h-[340px] flex flex-col justify-between bg-black/75">
        <AnimatePresence mode="wait" initial={false}>
          
          {/* TAB 1: MODELO SQL / DBT REAL */}
          {activeTab === 'model' && (
            <motion.div
              key="tab-model"
              initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
              transition={{ duration: 0.16 }}
              className="flex flex-col flex-1 justify-between"
            >
              <div className="p-3 sm:p-4 font-mono text-[11px] sm:text-xs leading-relaxed overflow-x-auto space-y-1 text-neutral-300">
                <div className="text-neutral-500 italic mb-2">
                  {'-- models/marts/mart_changelog.sql'}
                  <br />
                  {'-- Grano: 1 fila por release histórico'}
                </div>

                <div>
                  <span className="text-purple-400">with</span>{' '}
                  <span className="text-cyan-300">tool_versions</span>{' '}
                  <span className="text-purple-400">as</span> (
                </div>
                <div className="pl-4 text-neutral-400">
                  <span className="text-purple-400">select</span> tool_slug, category, effective_from,
                </div>
                <div className="pl-4 text-neutral-400">
                  coalesce(effective_to, <span className="text-amber-300">&apos;infinity&apos;</span>) <span className="text-purple-400">as</span> effective_to
                </div>
                <div className="pl-4">
                  <span className="text-purple-400">from</span>{' '}
                  <span className="text-emerald-400 font-semibold">{'{{ ref(\'stg_tools\') }}'}</span>{' '}
                  <span className="text-neutral-500">{'-- SCD Tipo 2'}</span>
                </div>
                <div>)</div>

                <div className="pt-1">
                  <span className="text-purple-400">select</span>
                </div>
                <div className="pl-4">r.release_id, r.tool_slug, <span className="text-cyan-300">t.category</span>, r.version, r.published_at</div>
                <div>
                  <span className="text-purple-400">from</span>{' '}
                  <span className="text-emerald-400 font-semibold">{'{{ ref(\'stg_releases\') }}'}</span>{' '}
                  <span className="text-purple-400">as</span> r
                </div>

                <div className="pt-1 text-neutral-500 italic pl-2 border-l border-neutral-700">
                  {'-- Join temporal: resuelve la dimensión al momento del release'}
                </div>
                <div>
                  <span className="text-purple-400 font-semibold">inner join</span> tool_versions{' '}
                  <span className="text-purple-400">as</span> t
                </div>
                <div className="pl-4 text-cyan-200">
                  <span className="text-purple-400">on</span> r.tool_slug = t.tool_slug
                </div>
                <div className="pl-4 text-cyan-200">
                  <span className="text-purple-400">and</span> r.published_at &lt; t.effective_to
                </div>
                <div className="pl-4 text-cyan-200">
                  <span className="text-purple-400">and</span> r.published_at &gt;= t.effective_from;
                </div>
              </div>

              <div className="px-4 py-2.5 bg-neutral-900/80 border-t border-neutral-800 flex flex-col gap-1 text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-semibold shrink-0">Arquitectura:</span>
                  <span className="text-neutral-300 font-sans font-light leading-snug">
                    Un join normal a `dim_tool` sobreescribiría la categoría histórica de DuckDB. El join de rango SCD2 garantiza que el analista consulte el pasado sin alterarlo.
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: ESQUEMA ESTRELLA (STAR SCHEMA) */}
          {activeTab === 'schema' && (
            <motion.div
              key="tab-schema"
              initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
              transition={{ duration: 0.16 }}
              className="p-4 flex flex-col gap-3 justify-between flex-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Fact Table Card */}
                <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Database size={12} className="text-cyan-400" />
                      fct_release
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-900/60 text-cyan-300 border border-cyan-800">
                      TABLA DE HECHOS
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 border-t border-cyan-900/50 pt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>🔑 release_id (PK)</span>
                      <span className="text-neutral-500">text</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>🔗 tool_slug (FK)</span>
                      <span className="text-neutral-500">dim ref</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>📅 published_at</span>
                      <span className="text-neutral-500">timestamptz</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>⚠️ has_breaking</span>
                      <span className="text-neutral-500">boolean</span>
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] text-cyan-400/90 font-sans italic pt-1 border-t border-cyan-950">
                    Grano: 1 fila por release histórico
                  </div>
                </div>

                {/* Lineage connection & SCD2 Join Card */}
                <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between gap-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                      <Workflow size={13} className="text-purple-400" />
                      Relación Temporal
                    </span>
                    <span className="text-[9px] text-neutral-400 font-mono px-1.5 py-0.5 rounded bg-neutral-800">
                      1:N con Ventana
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-300 space-y-1.5 font-mono bg-black/60 p-2 rounded-lg border border-neutral-800">
                    <div className="text-neutral-400 text-[9px]">// Join SCD Tipo 2:</div>
                    <div className="text-cyan-300">r.tool_slug = t.tool_slug</div>
                    <div className="text-purple-300">AND r.published_at &gt;= t.effective_from</div>
                    <div className="text-purple-300">AND r.published_at &lt; t.effective_to</div>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-sans leading-snug">
                    Resuelve el estado exacto de la herramienta en la fecha histórica en que ocurrió el evento.
                  </div>
                </div>

                {/* Dimension Card */}
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <Layers size={12} className="text-emerald-400" />
                      dim_tool
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-900/60 text-emerald-300 border border-emerald-800">
                      SCD TIPO 2
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 border-t border-emerald-900/50 pt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>🔑 tool_slug (Natural)</span>
                      <span className="text-neutral-500">text</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>🏷️ category</span>
                      <span className="text-neutral-500">text</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>⏳ effective_from</span>
                      <span className="text-neutral-500">timestamptz</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>⌛ effective_to</span>
                      <span className="text-neutral-500">timestamptz</span>
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] text-emerald-400/90 font-sans italic pt-1 border-t border-emerald-950">
                    Historial preservado sin sobreescritura
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: TESTS DE CALIDAD DBT */}
          {activeTab === 'tests' && (
            <motion.div
              key="tab-tests"
              initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
              transition={{ duration: 0.16 }}
              className="p-3 sm:p-4 flex flex-col gap-2.5 justify-between flex-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span className="text-neutral-200">unique(fct_release.release_id)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold">
                    PASS
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span className="text-neutral-200">not_null(fct_release.published_at)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold">
                    PASS
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span className="text-neutral-200">relationships(tool_slug → dim_tool)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold">
                    PASS
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span className="text-neutral-200">assert_no_future_releases.sql</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold">
                    PASS
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Activity size={12} />
                  <span className="font-semibold">41 de 41 dbt tests en verde</span>
                </div>
                <span>Neon PostgreSQL</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
