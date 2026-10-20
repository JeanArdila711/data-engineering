'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { WizardOption } from '@/lib/roadmap';
import type { RetoEntry } from '@/lib/db';
import {
  Workflow,
  Database,
  Radio,
  Cloud,
  Compass,
  Clock,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { RevealButton } from '@/components/ui/reveal-button';

interface RetoCardProps {
  objetivo: WizardOption;
  reto: RetoEntry | null;
  index?: number;
}

const DOMAIN_METADATA: Record<
  string,
  {
    domainCode: string;
    domainLabel: string;
    icon: typeof Workflow;
  }
> = {
  'pipelines-batch': {
    domainCode: 'SPEC-01',
    domainLabel: 'PIPELINES BATCH & IDEMPOTENCIA',
    icon: Workflow,
  },
  'modelado-analitico': {
    domainCode: 'SPEC-02',
    domainLabel: 'OLAP & MODELADO DIMENSIONAL',
    icon: Database,
  },
  'streaming': {
    domainCode: 'SPEC-03',
    domainLabel: 'STREAMING & TIEMPO REAL',
    icon: Radio,
  },
  'plataforma-cloud': {
    domainCode: 'SPEC-04',
    domainLabel: 'PLATAFORMA CLOUD & FINOPS',
    icon: Cloud,
  },
  'ruta-completa': {
    domainCode: 'SPEC-05',
    domainLabel: 'ARQUITECTURA DE PUNTA A PUNTA',
    icon: Compass,
  },
};

export default function RetoCard({ objetivo, reto, index = 0 }: RetoCardProps) {
  const tieneReto = reto !== null && reto.escenario !== null;
  const meta = DOMAIN_METADATA[objetivo.slug] || {
    domainCode: `SPEC-${String(index + 1).padStart(2, '0')}`,
    domainLabel: 'DATA ENGINEERING',
    icon: Workflow,
  };

  const Icon = meta.icon;

  // CASO 1: Objetivo con Reto Activo (pipelines-batch, modelado-analitico)
  if (tieneReto) {
    const fallasCount = reto.checklist.filter(c => Boolean(c.experiencia_texto)).length;

    return (
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -2 }}
        className="group relative rounded-2xl border border-neutral-800/80 bg-neutral-950/80 p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 hover:border-neutral-700/90 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        {/* Shard de luz superior sutil (1px Hairline Highlight) - Anti AI-slop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        <div className="flex flex-col gap-5">
          {/* Header de Ficha de Ingeniería */}
          <div className="flex items-center justify-between border-b border-neutral-800/70 pb-3.5">
            <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
              <Icon size={13} className="text-neutral-400 transition-colors group-hover:text-neutral-200" />
              <span className="font-semibold text-neutral-300">[{meta.domainCode}]</span>
              <span className="text-neutral-700 select-none">·</span>
              <span className="truncate max-w-[200px] uppercase text-neutral-400">{meta.domainLabel}</span>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-900/50 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
              <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
              LISTO
            </span>
          </div>

          {/* Título de Objetivo */}
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading uppercase leading-snug transition-colors group-hover:text-neutral-100">
              {objetivo.nombre}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
              {objetivo.descripcion.trim()}
            </p>
          </div>

          {/* Bento Grid de Telemetría Arquitectónica */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3 flex flex-col justify-between transition-colors group-hover:border-neutral-700/60">
              <span className="font-mono text-[10px] uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-neutral-400 transition-colors group-hover:text-emerald-400" />
                CRITERIOS
              </span>
              <span className="mt-1 font-mono text-xs sm:text-sm font-semibold text-neutral-200">
                {reto.checklist.length} de Dominio
              </span>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3 flex flex-col justify-between transition-colors group-hover:border-neutral-700/60">
              <span className="font-mono text-[10px] uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={11} className="text-neutral-400 transition-colors group-hover:text-amber-400" />
                POSTMORTEMS
              </span>
              <span className="mt-1 font-mono text-xs sm:text-sm font-semibold text-neutral-200">
                {fallasCount} en Producción
              </span>
            </div>
          </div>
        </div>

        {/* Footer con Acción White Luxury */}
        <div className="pt-5 mt-6 border-t border-neutral-800/70 flex items-center justify-between gap-4">
          <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1.5">
            <span className="text-neutral-600">{'//'}</span>
            <span>RUNTIME: LOCAL-FIRST</span>
          </div>

          <RevealButton href={`/practica/${objetivo.slug}`} size="sm">
            Iniciar Reto
          </RevealButton>
        </div>
      </motion.article>
    );
  }

  // CASO 2: Objetivo en Standby con Motivo de Ausencia Honesto (streaming, plataforma-cloud, ruta-completa)
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 0.85, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ opacity: 1 }}
      className="relative rounded-2xl border border-neutral-900 bg-neutral-950/40 p-6 sm:p-7 flex flex-col justify-between select-none transition-opacity duration-200"
    >
      <div className="flex flex-col gap-4">
        {/* Header de Ficha Atenuada */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
          <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-500">
            <Icon size={12} className="text-neutral-600" />
            <span>[{meta.domainCode}]</span>
            <span className="text-neutral-800 select-none">·</span>
            <span className="truncate max-w-[180px] uppercase text-neutral-600">{meta.domainLabel}</span>
          </div>

          <span className="rounded-md border border-neutral-800/60 bg-neutral-900/60 px-2 py-0.5 font-mono text-[10px] text-neutral-500">
            EN ESPERA
          </span>
        </div>

        {/* Título de Objetivo Inactivo */}
        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-400 font-heading uppercase leading-snug">
            {objetivo.nombre}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 font-normal leading-relaxed">
            {objetivo.descripcion.trim()}
          </p>
        </div>

        {/* Motivo de Ausencia Técnico Documentado */}
        {reto?.motivo_ausencia && (
          <div className="mt-2 rounded-xl border border-neutral-900/80 bg-neutral-900/20 p-3.5 space-y-1 font-mono text-xs">
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase font-semibold">
              <Clock size={11} className="text-neutral-600" />
              <span>{'//'} Regla de Ausencia Honesta:</span>
            </div>
            <p className="font-sans text-xs text-neutral-400 leading-relaxed font-normal">
              {reto.motivo_ausencia.trim()}
            </p>
          </div>
        )}
      </div>

      {/* Footer Informativo */}
      <div className="pt-4 mt-6 border-t border-neutral-900/80 flex items-center justify-between text-[11px] font-mono text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-neutral-700" />
          <span>Sin reto hasta tener experiencia viva</span>
        </span>
        <span className="text-neutral-600">404</span>
      </div>
    </motion.article>
  );
}
