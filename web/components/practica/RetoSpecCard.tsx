'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, Calendar, AlertTriangle, Database } from 'lucide-react';
import { motion } from 'framer-motion';

interface RetoSpecCardProps {
  objetivoSlug: string;
  objetivoNombre: string;
  escenario: string;
}

export function RetoSpecCard({
  objetivoSlug,
  objetivoNombre,
  escenario,
}: RetoSpecCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(escenario.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isPipelinesBatch = objetivoSlug === 'pipelines-batch';
  const isModelado = objetivoSlug === 'modelado-analitico';

  return (
    <motion.section
      id="escenario"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6 sm:p-8 backdrop-blur-md"
    >
      {/* Top Window Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-red-500/80" />
            <span className="size-2.5 rounded-full bg-yellow-500/80" />
            <span className="size-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="font-mono text-xs text-neutral-400">
            spec/reto-{objetivoSlug}.md
          </span>
          <span className="hidden sm:inline-flex rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
            UTF-8 · RFC SPEC
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/90 px-3 py-1.5 font-mono text-xs text-neutral-300 transition-colors hover:border-neutral-700 hover:text-white"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copiado</span>
            </>
          ) : (
            <>
              <Copy size={13} className="text-neutral-400" />
              <span>Copiar directiva</span>
            </>
          )}
        </button>
      </div>

      {/* Eyebrow & Title */}
      <div className="mt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/30 px-3 py-1 font-mono text-[11px] text-cyan-300">
          <Terminal size={12} className="text-cyan-400" />
          <span>DIRECTIVA TÉCNICA · REQUISITO DE LABORATORIO</span>
        </div>
        <h2 className="mt-3 font-sans text-xl sm:text-2xl font-bold tracking-tight text-white">
          El Escenario de Implementación · {objetivoNombre}
        </h2>
      </div>

      {/* Main Scenario Brief Body */}
      <div className="mt-5 rounded-xl border border-neutral-800/90 bg-black/60 p-5 sm:p-6 font-sans text-sm sm:text-base leading-relaxed text-neutral-200">
        <p className="whitespace-pre-line">{escenario.trim()}</p>

        {/* GitHub Repository Reference Link if Modelado */}
        {isModelado && (
          <div className="mt-4 pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-neutral-400">
              Fuente de referencia sugerida: <code className="text-cyan-300">catalog/tools.yaml</code>
            </span>
            <a
              href="https://github.com/JeanArdila711/data-engineering/tree/main/catalog/tools.yaml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              <span>Ver archivo en GitHub</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>

      {/* Architectural Constraints Bento Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {isPipelinesBatch ? (
          <>
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Database size={15} />
                <span className="font-mono text-xs font-semibold uppercase">Fuente Cruda</span>
              </div>
              <p className="mt-2 text-xs font-sans text-neutral-400 leading-relaxed">
                Consumir una API real o base cambiante. Guardar el crudo sin transformaciones para garantizar replayability.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Calendar size={15} />
                <span className="font-mono text-xs font-semibold uppercase">Ventana 72h</span>
              </div>
              <p className="mt-2 text-xs font-sans text-neutral-400 leading-relaxed">
                Dejalo corriendo en cron o Airflow durante al menos 3 días consecutivos sin tocar el código ni reiniciar manualmente.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle size={15} />
                <span className="font-mono text-xs font-semibold uppercase">Caos Día 4</span>
              </div>
              <p className="mt-2 text-xs font-sans text-neutral-400 leading-relaxed">
                Modificá la fuente a propósito (un nulo inesperado, un duplicado o cambio de formato) y confirmá que el sistema no corrompe datos.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Database size={15} />
                <span className="font-mono text-xs font-semibold uppercase">SCD Tipo 2</span>
              </div>
              <p className="mt-2 text-xs font-sans text-neutral-400 leading-relaxed">
                Dimensiones con vigencias temporales (<code className="text-neutral-300">valid_from</code>, <code className="text-neutral-300">valid_to</code>) y flag <code className="text-neutral-300">is_current</code>.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Calendar size={15} />
                <span className="font-mono text-xs font-semibold uppercase">Grano Explícito</span>
              </div>
              <p className="mt-2 text-xs font-sans text-neutral-400 leading-relaxed">
                Definir qué representa exactamente una fila de la tabla de hechos antes de escribir la primera transformación.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <Terminal size={15} />
                <span className="font-mono text-xs font-semibold uppercase">Test Histórico</span>
              </div>
              <p className="mt-2 text-xs font-sans text-neutral-400 leading-relaxed">
                Ejecutar una consulta SQL que reconstruya el estado pasado de una entidad exactamente como era hace un mes.
              </p>
            </div>
          </>
        )}
      </div>
    </motion.section>
  );
}
