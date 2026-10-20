'use client';

import React from 'react';
import type { RetoChecklistItem } from '@/lib/db';
import { Check, CheckCircle2, RotateCcw, ShieldCheck, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RetoChecklistSectionProps {
  checklist: RetoChecklistItem[];
  checkedSlugs: string[];
  onToggle: (slug: string) => void;
  onReset: () => void;
}

export function RetoChecklistSection({
  checklist,
  checkedSlugs,
  onToggle,
  onReset,
}: RetoChecklistSectionProps) {
  const total = checklist.length;
  const count = checkedSlugs.length;
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  const isComplete = total > 0 && count === total;

  return (
    <section id="checklist" className="space-y-6">
      {/* Section Header with Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 font-mono text-[11px] text-emerald-300">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>CODE REVIEW LOCAL · CRITERIOS DE DOMINIO</span>
          </div>
          <h2 className="mt-3 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Sabés que lo lograste si…
          </h2>
          <p className="mt-1 font-sans text-sm text-neutral-400">
            Usá este checklist como tu propio code review. Marcá cada punto únicamente si tu sistema real sobrevive a la condición.
          </p>
        </div>

        {/* Reset Button */}
        {count > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 font-mono text-xs text-neutral-400 transition-colors hover:border-neutral-700 hover:text-neutral-200"
            title="Reiniciar todos los criterios marcados"
          >
            <RotateCcw size={12} />
            <span>Reiniciar progreso</span>
          </button>
        )}
      </div>

      {/* Live Telemetry Progress Bar HUD */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 sm:p-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">PROGRESO DE VERIFICACIÓN:</span>
            <strong className="text-white font-semibold">
              {count} de {total} Criterios ({percent}%)
            </strong>
          </div>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-2.5 py-0.5 text-emerald-300 font-semibold">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ARQUITECTURA VALIDADA
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 px-2.5 py-0.5 text-amber-300 font-medium">
                <span className="size-1.5 rounded-full bg-amber-400" />
                EN PROGRESO ({total - count} PENDIENTES)
              </span>
            )}
          </div>
        </div>

        {/* Bar */}
        <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-neutral-900 border border-neutral-800/80">
          <motion.div
            className={`h-full ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        </div>
      </div>

      {/* Completion Banner if 100% */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-4 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 to-cyan-950/20 p-5 backdrop-blur-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/50 bg-emerald-900/40 text-emerald-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-emerald-200">
                ¡Todos los criterios de aceptación verificados!
              </h3>
              <p className="mt-1 font-sans text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Has validado de forma autónoma cada regla en tu propia máquina. Tu arquitectura sobrevive a reintentos, caídas y cambios de esquema sin requerir revisión externa.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checklist Items Grid */}
      <ul className="space-y-3.5" role="list">
        {checklist.map((item, index) => {
          const isChecked = checkedSlugs.includes(item.slug);

          return (
            <motion.li
              key={item.slug}
              layout
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              onClick={() => onToggle(item.slug)}
              className={`group relative flex cursor-pointer items-start gap-4 rounded-xl border p-5 sm:p-6 transition-all duration-200 ${
                isChecked
                  ? 'border-emerald-500/40 bg-neutral-950/90 shadow-[0_0_24px_rgba(16,185,129,0.06)]'
                  : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-900/40'
              }`}
            >
              {/* Custom Accessible Checkbox */}
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                aria-label={`Marcar como completado: ${item.nombre}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(item.slug);
                }}
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
                  isChecked
                    ? 'border-emerald-400 bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'border-neutral-700 bg-neutral-900 text-transparent group-hover:border-neutral-500'
                }`}
              >
                {isChecked && <Check size={14} className="stroke-[3]" />}
              </button>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-neutral-400">
                    [CRITERIO {String(index + 1).padStart(2, '0')}]
                  </span>
                  <span className="text-neutral-700 select-none">·</span>
                  <span className="font-mono text-xs font-semibold uppercase text-cyan-300">
                    {item.nombre}
                  </span>
                  {isChecked && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                      <Check size={10} />
                      VALIDADO EN TU MÁQUINA
                    </span>
                  )}
                </div>

                {/* Dominado cuando text */}
                <p
                  className={`mt-2 font-sans text-sm sm:text-base leading-relaxed transition-colors ${
                    isChecked ? 'text-neutral-200' : 'text-neutral-100 font-medium'
                  }`}
                >
                  {item.dominado_cuando.trim()}
                </p>

                {/* Jump link to postmortem if available */}
                {item.experiencia_texto && (
                  <div className="mt-3.5 pt-3 border-t border-neutral-900 flex items-center justify-between gap-3">
                    <a
                      href={`#postmortem-${item.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-amber-400/90 hover:text-amber-300 transition-colors group/link"
                    >
                      <ArrowDown size={12} className="transition-transform group-hover/link:translate-y-0.5" />
                      <span>Ver incidente real documentado en prod</span>
                    </a>
                  </div>
                )}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
