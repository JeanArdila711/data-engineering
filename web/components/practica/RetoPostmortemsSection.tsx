'use client';

import React from 'react';
import type { RetoChecklistItem } from '@/lib/db';
import { AlertTriangle, ExternalLink, GitCommit, ShieldAlert, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface RetoPostmortemsSectionProps {
  conFalla: RetoChecklistItem[];
}

function extractCommitHash(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/commit\/([a-f0-9]+)/i);
  return match ? match[1] : null;
}

export function RetoPostmortemsSection({ conFalla }: RetoPostmortemsSectionProps) {
  if (conFalla.length === 0) return null;

  return (
    <section id="postmortems" className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-neutral-800/80 pb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-950/30 px-3 py-1 font-mono text-[11px] text-amber-300">
          <ShieldAlert size={12} className="text-amber-400" />
          <span>INCIDENTES DE COMBATE REAL · POSTMORTEMS</span>
        </div>
        <h2 className="mt-3 font-sans text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Esto es lo que se rompe
        </h2>
        <p className="mt-1 font-sans text-sm text-neutral-400 max-w-3xl">
          Fallos silenciosos documentados en la construcción real de este proyecto. No son ejemplos de juguete: pasaron desapercibidos en desarrollo y rompieron datos en producción.
        </p>
      </div>

      {/* Postmortems List */}
      <div className="space-y-4">
        {conFalla.map((item, index) => {
          const commitHash = extractCommitHash(item.experiencia_link);
          const hasLink = Boolean(item.experiencia_link);

          return (
            <motion.article
              key={item.slug}
              id={`postmortem-${item.slug}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/70 p-5 sm:p-6 backdrop-blur-sm transition-colors hover:border-amber-500/30"
            >
              {/* Subtle top indicator bar */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-amber-500/0 via-amber-500/30 to-amber-500/0 opacity-0 transition-opacity group-hover:opacity-100"
              />

              {/* Card Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-900 pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-amber-400">
                    INCIDENTE #{String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-neutral-700 select-none">·</span>
                  <span className="font-mono text-xs uppercase tracking-wide text-neutral-300">
                    {item.nombre}
                  </span>
                </div>

                {hasLink ? (
                  <a
                    href={item.experiencia_link!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-950/20 px-2.5 py-1 font-mono text-xs text-amber-300 transition-colors hover:border-amber-500/60 hover:bg-amber-900/30 hover:text-amber-200"
                  >
                    <GitCommit size={13} className="text-amber-400" />
                    <span>
                      {commitHash ? `commit ${commitHash}` : 'Ver evidencia en repo'}
                    </span>
                    <ExternalLink size={11} className="text-amber-400/80" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 font-mono text-xs text-neutral-400">
                    <FileText size={12} className="text-neutral-500" />
                    <span>DEUDA DE DISEÑO REGISTRADA</span>
                  </span>
                )}
              </div>

              {/* Postmortem Description */}
              <div className="mt-4">
                <p className="font-sans text-sm sm:text-base leading-relaxed text-neutral-200 whitespace-pre-line">
                  {item.experiencia_texto?.trim()}
                </p>
              </div>

              {/* Invariant Footer Reminder */}
              <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                <AlertTriangle size={12} className="text-amber-500/80 shrink-0" />
                <span>
                  Lección de arquitectura: los contratos y constraints en la base superan a la disciplina del código.
                </span>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
