'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RoadmapNode } from '@/lib/roadmap';
import {
  Search,
  ExternalLink,
  BookOpen,
  X,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { ScrollRevealTitle } from '@/components/ui/scroll-reveal-title';

interface PracticaDirectorioProps {
  grupos: { nivel: number; nodes: RoadmapNode[] }[];
  niveles: Record<number, string>;
}

function getHostName(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'externo';
  }
}

export default function PracticaDirectorio({
  grupos,
  niveles,
}: PracticaDirectorioProps) {
  const [selectedNivel, setSelectedNivel] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Aplanar todos los nodos con recursos
  const allNodes = useMemo(() => grupos.flatMap(g => g.nodes), [grupos]);
  const totalRecursos = useMemo(
    () => allNodes.reduce((acc, n) => acc + n.practica_externa.length, 0),
    [allNodes]
  );

  // 2. Niveles únicos presentes en los grupos
  const uniqueNiveles = useMemo(() => grupos.map(g => g.nivel), [grupos]);

  // 3. Filtrar nodos según nivel y búsqueda
  const filteredNodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allNodes.filter(node => {
      // Filtro de Nivel
      if (selectedNivel !== null && node.nivel !== selectedNivel) {
        return false;
      }

      // Filtro de Búsqueda
      if (!q) return true;

      const matchNode =
        node.nombre.toLowerCase().includes(q) ||
        node.slug.toLowerCase().includes(q) ||
        node.resuelve.toLowerCase().includes(q);

      const matchResource = node.practica_externa.some(
        r =>
          r.nombre.toLowerCase().includes(q) ||
          r.por_que.toLowerCase().includes(q) ||
          r.url.toLowerCase().includes(q)
      );

      return matchNode || matchResource;
    });
  }, [allNodes, selectedNivel, searchQuery]);

  const totalVisibleRecursos = useMemo(
    () => filteredNodes.reduce((acc, n) => acc + n.practica_externa.length, 0),
    [filteredNodes]
  );

  if (grupos.length === 0) return null;

  return (
    <section id="directorio" className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-16 scroll-mt-24">
      {/* Encabezado de Sección */}
      <div className="mb-8 border-t border-neutral-800/80 pt-12 flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-400 w-fit">
          <BookOpen size={12} className="text-emerald-400" />
          <span>[07.2] // DIRECTORIO CURADO · HABILIDADES ATÓMICAS</span>
        </div>

        <ScrollRevealTitle
          text="Directorio de Práctica Externa"
          as="h2"
          className="text-2xl sm:text-4xl font-bold tracking-tight uppercase leading-[1.1] text-white font-heading"
        />

        <p className="text-sm md:text-base text-neutral-400 font-light max-w-3xl leading-relaxed">
          Para habilidades atómicas (SQL, Git, línea de comandos), ya existen excelentes plataformas interactivas en internet. Aplicamos la <strong className="text-neutral-200 font-medium">regla de ausencia</strong>: si un nodo no cuenta con una alternativa verificada de alta calidad, se omite en silencio en vez de recomendar enlaces de relleno.
        </p>
      </div>

      {/* Toolbar estilo IDE: Selector de Niveles + Búsqueda */}
      <div className="mb-8 flex flex-col gap-4">
        {/* Fila 1: Píldoras de Filtro por Nivel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedNivel(null)}
            className={`relative px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer ${
              selectedNivel === null
                ? 'text-white font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-950/60 border border-neutral-800/80'
            }`}
          >
            {selectedNivel === null && (
              <motion.div
                layoutId="active-practica-level-pill"
                className="absolute inset-0 bg-neutral-800/90 rounded-lg border border-neutral-700/80 shadow-[0_0_12px_rgba(255,255,255,0.08)] z-0"
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              />
            )}
            <span className="relative z-10">Todos ({allNodes.length})</span>
          </button>

          {uniqueNiveles.map(lvl => {
            const count = allNodes.filter(n => n.nivel === lvl).length;
            const isSelected = selectedNivel === lvl;
            const label = niveles[lvl] ?? `Nivel ${lvl}`;

            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedNivel(lvl)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 bg-neutral-950/60 border border-neutral-800/80'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="active-practica-level-pill"
                    className="absolute inset-0 bg-neutral-800/90 rounded-lg border border-neutral-700/80 shadow-[0_0_12px_rgba(255,255,255,0.08)] z-0"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>{label}</span>
                  <span className="text-[10px] text-neutral-500 font-normal">({count})</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Fila 2: Input de Búsqueda Rápida + Conteo en Vivo */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-neutral-800/80 pt-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por habilidad, concepto o plataforma (ej. SQL, Git, bandit)..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950/90 pl-9 pr-9 py-2 text-xs font-mono text-white placeholder-neutral-500 outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-neutral-500 flex items-center gap-2 shrink-0">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Mostrando <strong className="text-neutral-300 font-normal">{totalVisibleRecursos}</strong> de {totalRecursos} recursos curados
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Fichas de Nodos con Recursos */}
      {filteredNodes.length > 0 ? (
        <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          <AnimatePresence mode="popLayout">
            {filteredNodes.map(node => {
              const nivelNombre = niveles[node.nivel] ?? `Nivel ${node.nivel}`;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -3 }}
                  key={node.slug}
                  className="group relative rounded-2xl border border-neutral-800/80 bg-neutral-950/80 p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all duration-200 hover:border-neutral-700/90 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  {/* Shard de luz superior sutil (1px Hairline Highlight) */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />

                  {/* Cabecera del Nodo */}
                  <div className="space-y-2 border-b border-neutral-800/80 pb-4">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded-md border border-neutral-800 bg-neutral-900 text-neutral-400">
                        NIVEL {node.nivel} {'//'} {nivelNombre.toUpperCase()}
                      </span>
                      <span className="text-neutral-500 uppercase">{node.tipo}</span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white font-heading uppercase">
                      {node.nombre}
                    </h3>

                    <p className="text-xs text-neutral-400 font-light leading-relaxed">
                      {node.resuelve}
                    </p>
                  </div>

                  {/* Lista de Recursos Curados */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 block">
                      {'//'} Plataformas Recomendadas:
                    </span>

                    {node.practica_externa.map(recurso => {
                      const host = getHostName(recurso.url);

                      return (
                        <div
                          key={recurso.url}
                          className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3.5 space-y-2 hover:border-neutral-700 hover:bg-neutral-900/70 transition-all group/item"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-medium text-white group-hover:text-emerald-300 transition-colors">
                              {recurso.nombre}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500 border border-neutral-800/80 bg-neutral-900 px-1.5 py-0.5 rounded">
                              {host}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-400 font-sans font-light leading-relaxed">
                            {recurso.por_que}
                          </p>

                          <div className="pt-1 flex justify-end">
                            <a
                              href={recurso.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                            >
                              <span>Practicar en plataforma</span>
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Estado Vacío Honesto */
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-12 text-center flex flex-col items-center justify-center gap-3">
          <Layers size={28} className="text-neutral-600" />
          <h4 className="text-base font-semibold text-neutral-300">
            Sin recursos coincidentes
          </h4>
          <p className="text-xs text-neutral-500 max-w-sm font-light">
            No encontramos ninguna plataforma de práctica con el filtro actual &quot;{searchQuery}&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedNivel(null);
            }}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Restablecer filtros</span>
          </button>
        </div>
      )}
    </section>
  );
}
