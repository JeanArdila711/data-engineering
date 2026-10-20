'use client';

import React from 'react';
import { ShieldCheck, Lock, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export function RetoIntegridadCard() {
  return (
    <motion.section
      id="integridad"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 sm:p-8 backdrop-blur-md"
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-neutral-800/20 blur-3xl"
      />

      {/* Top Header Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
            <ShieldCheck size={16} />
          </div>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {'//'} Principio de Evaluación Real
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-500">
          <Lock size={12} className="text-neutral-600" />
          <span>ZERO-MOCK · SIN AUTO-GRADING</span>
        </div>
      </div>

      {/* Plaque Content */}
      <div className="mt-6 space-y-4 font-sans text-sm sm:text-base leading-relaxed text-neutral-300">
        <p>
          <strong className="font-semibold text-white">No hay una solución que comparar.</strong> Tu fuente, tu
          storage y tu forma de resolverlo van a ser distintos a los de cualquier otra persona — eso es
          real, no un hueco del sitio. Un pipeline se valida corriendo, no contra una plantilla. Usá el
          checklist como tu propio code review: si podés marcar cada punto de verdad, lo lograste.
        </p>
        <p className="font-mono text-xs sm:text-sm text-neutral-400 border-l-2 border-emerald-500/40 pl-4 py-1 bg-emerald-950/10 rounded-r">
          Acá no hay nadie revisando tu resultado. Si querés que otra persona lo mire, este no es el lugar.
        </p>
      </div>

      {/* Engineering Footer Signature */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/60 pt-4 text-[11px] font-mono text-neutral-500">
        <span className="flex items-center gap-1.5">
          <Terminal size={12} className="text-neutral-600" />
          <span>VALIDACIÓN AUTÓNOMA EN TU MÁQUINA</span>
        </span>
        <span className="text-neutral-600">DE RADAR · WORKBENCH v1.0</span>
      </div>
    </motion.section>
  );
}
