'use client';

import React from 'react';
import Link from 'next/link';
import type { RetoChecklistItem } from '@/lib/db';
import {
  Compass,
  Shield,
  ExternalLink,
  ArrowRight,
  Flame,
  FileCode2,
  ListChecks,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface RetoWorkbenchSidebarProps {
  checklist: RetoChecklistItem[];
  checkedSlugs: string[];
  conFallaCount: number;
  otroReto?: {
    slug: string;
    nombre: string;
    descripcion: string;
    checklistCount: number;
  } | null;
}

export function RetoWorkbenchSidebar({
  checklist,
  checkedSlugs,
  conFallaCount,
  otroReto,
}: RetoWorkbenchSidebarProps) {
  const total = checklist.length;
  const count = checkedSlugs.length;
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  const isComplete = total > 0 && count === total;

  return (
    <aside className="space-y-6">
      {/* 1. Live HUD Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Workbench Telemetry
            </h3>
          </div>
          <span className="font-mono text-[11px] text-neutral-400">
            {count}/{total} OK
          </span>
        </div>

        {/* Big percentage & status */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {percent}%
            </span>
            <span className="ml-2 font-mono text-xs text-neutral-400">verificado</span>
          </div>
          <div>
            {isComplete ? (
              <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                100% COMPLETADO
              </span>
            ) : (
              <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 font-mono text-[10px] text-neutral-400">
                EN PROGRESO
              </span>
            )}
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-900">
          <motion.div
            className={`h-full ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
            }`}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        </div>

        {/* Mini criteria list */}
        <div className="mt-4 pt-3.5 border-t border-neutral-900 space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
            Estado de Criterios:
          </p>
          <ul className="space-y-1.5 text-xs font-mono">
            {checklist.map((item, idx) => {
              const isChecked = checkedSlugs.includes(item.slug);
              return (
                <li key={item.slug} className="flex items-center justify-between gap-2">
                  <a
                    href="#checklist"
                    className="truncate hover:text-white transition-colors text-neutral-400"
                  >
                    <span className="text-neutral-400">{String(idx + 1).padStart(2, '0')}.</span>{' '}
                    {item.nombre}
                  </a>
                  {isChecked ? (
                    <span className="text-emerald-400 text-[10px] shrink-0 font-semibold">[OK]</span>
                  ) : (
                    <span className="text-neutral-400 text-[10px] shrink-0">[--]</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* 2. Document Fast Navigation */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 backdrop-blur-md">
        <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-800/80 pb-3">
          Navegación del Spec
        </h4>
        <nav className="mt-3.5 space-y-2 font-mono text-xs">
          <a
            href="#escenario"
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
          >
            <FileCode2 size={13} className="text-neutral-500" />
            <span>01 // El Escenario</span>
          </a>
          <a
            href="#checklist"
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <ListChecks size={13} className="text-cyan-400" />
              <span>02 // Criterios de Éxito</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-semibold">{checklist.length}</span>
          </a>
          {conFallaCount > 0 && (
            <a
              href="#postmortems"
              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <Flame size={13} className="text-amber-400" />
                <span>03 // Lo Que Se Rompe</span>
              </span>
              <span className="text-[10px] text-amber-500 font-semibold">{conFallaCount}</span>
            </a>
          )}
          <a
            href="#integridad"
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
          >
            <Shield size={13} className="text-emerald-400" />
            <span>04 // Principio de Integridad</span>
          </a>
        </nav>
      </div>

      {/* 3. Workbench Invariants */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 backdrop-blur-md">
        <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-800/80 pb-3">
          Reglas del Laboratorio
        </h4>
        <div className="mt-3.5 space-y-3 font-sans text-xs text-neutral-400 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <span className="font-mono text-cyan-400 font-bold shrink-0">01.</span>
            <p>
              <strong className="text-neutral-200">Zero-Mock Testing:</strong> Prohibido usar mocks en la base. Corré contra DuckDB, SQLite o Postgres local en Docker.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="font-mono text-amber-400 font-bold shrink-0">02.</span>
            <p>
              <strong className="text-neutral-200">Supervivencia al Tiempo:</strong> El pipeline debe correr desatendido mínimo 3 días sin reinicios manuales.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="font-mono text-emerald-400 font-bold shrink-0">03.</span>
            <p>
              <strong className="text-neutral-200">Degradación Honesta:</strong> Si la fuente cambia, registrá el error sin descartar datos previos en silencio.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Alternative Challenge Link */}
      {otroReto && (
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900/60 to-neutral-950/80 p-5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400">
            <Compass size={12} />
            <span>Siguiente Disciplina</span>
          </div>
          <h4 className="mt-2 font-sans text-sm font-bold text-white">
            {otroReto.nombre}
          </h4>
          <p className="mt-1 font-sans text-xs text-neutral-400 line-clamp-2">
            {otroReto.descripcion.trim()}
          </p>
          <Link
            href={`/practica/${otroReto.slug}`}
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-cyan-300 hover:text-cyan-200 transition-colors group"
          >
            <span>Ver este reto ({otroReto.checklistCount} criterios)</span>
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}

      {/* 5. GitHub Repo Reference */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4 text-xs font-mono flex items-center justify-between text-neutral-400">
        <span className="truncate">github.com/JeanArdila711</span>
        <a
          href="https://github.com/JeanArdila711/data-engineering"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 shrink-0"
        >
          <span>Repo</span>
          <ExternalLink size={11} />
        </a>
      </div>
    </aside>
  );
}
