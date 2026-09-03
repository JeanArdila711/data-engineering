'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { RoadmapNode } from '@/lib/roadmap';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X, 
  Layers, 
  Cpu, 
  Sparkles, 
  FileCode,
  FolderTree,
  Terminal,
  Activity
} from 'lucide-react';
import { getNodeFileName } from '@/components/roadmap/RoadmapIdeView';

const NIVELES: Record<number, string> = {
  0: 'Base', 1: 'Modelo mental', 2: 'Ingesta', 3: 'Almacenamiento',
  4: 'Almacenamiento analítico', 5: 'Transformación y modelado',
  6: 'Orquestación', 7: 'Streaming', 8: 'Garantías de entrega',
  9: 'Procesamiento distribuido', 10: 'Nube', 11: 'Transversales',
};

interface RoadmapCardsViewProps {
  grupos: { nivel: number; nodes: RoadmapNode[] }[];
  notas?: Record<string, string>;
  onOpenIde: (slug: string) => void;
  nodeMap: Map<string, RoadmapNode>;
  dependentsMap: Map<string, string[]>;
}

export default function RoadmapCardsView({
  grupos,
  notas = {},
  onOpenIde,
  nodeMap,
  dependentsMap,
}: RoadmapCardsViewProps) {
  // Stepper level filter: null means 'all', or number 0..11
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  // Selected node for Expandable Card Modal
  const [inspectedSlug, setInspectedSlug] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect mobile viewport
  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  // Flattened nodes list in topological order for arrow navigation
  const allNodesList = useMemo(() => grupos.flatMap(g => g.nodes), [grupos]);

  const inspectedNode = inspectedSlug ? nodeMap.get(inspectedSlug) : null;
  const currentIndex = inspectedSlug ? allNodesList.findIndex(n => n.slug === inspectedSlug) : -1;
  const totalCount = allNodesList.length;

  // Filter groups according to selected level
  const displayedGrupos = useMemo(() => {
    if (selectedLevel === null) return grupos;
    return grupos.filter(g => g.nivel === selectedLevel);
  }, [grupos, selectedLevel]);

  // Check if the inspected node is currently rendered in the DOM grid
  // (Prevents Framer Motion layoutId jump if user navigates to a node in a different filtered level)
  const isInspectedInView = useMemo(() => {
    if (!inspectedSlug) return false;
    return displayedGrupos.some(g => g.nodes.some(n => n.slug === inspectedSlug));
  }, [displayedGrupos, inspectedSlug]);

  // Stepper levels available
  const availableLevels = useMemo(() => {
    return grupos.map(g => ({
      nivel: g.nivel,
      nombre: NIVELES[g.nivel] || `Nivel ${g.nivel}`,
      count: g.nodes.length,
    }));
  }, [grupos]);

  // Previous & Next node navigation
  const goToPrev = () => {
    if (totalCount === 0 || currentIndex === -1) return;
    setDirection(-1);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : totalCount - 1;
    setInspectedSlug(allNodesList[prevIndex].slug);
  };

  const goToNext = () => {
    if (totalCount === 0 || currentIndex === -1) return;
    setDirection(1);
    const nextIndex = currentIndex < totalCount - 1 ? currentIndex + 1 : 0;
    setInspectedSlug(allNodesList[nextIndex].slug);
  };

  // Keyboard navigation (ESC, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!inspectedSlug) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspectedSlug(null);
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inspectedSlug, currentIndex, totalCount]);

  // Prereqs & Dependents for inspected node
  const prereqs = inspectedNode?.prerequisitos || [];
  const dependents = inspectedNode ? (dependentsMap.get(inspectedNode.slug) || []) : [];
  const fileInfo = inspectedNode ? getNodeFileName(inspectedNode) : null;

  return (
    <div className="space-y-6">
      
      {/* 1. Level Stepper / Pipeline Phase Navigator */}
      <div className="p-3 rounded-2xl border border-neutral-800/80 bg-neutral-950/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setSelectedLevel(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedLevel === null
                ? 'bg-neutral-800 text-white font-medium shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
            }`}
          >
            <span>Todos los Niveles ({allNodesList.length})</span>
          </button>

          {availableLevels.map(lvl => {
            const isActive = selectedLevel === lvl.nivel;
            return (
              <button
                key={lvl.nivel}
                onClick={() => setSelectedLevel(lvl.nivel)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-950/50 border border-emerald-700/70 text-emerald-300 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40 border border-transparent'
                }`}
              >
                <span className="text-[10px] text-neutral-500 font-mono">L{lvl.nivel}</span>
                <span>{lvl.nombre}</span>
                <span className="size-4 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-center">
                  {lvl.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stepper Next/Prev buttons if a single level is selected */}
        {selectedLevel !== null && (
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
            <button
              onClick={() => setSelectedLevel(prev => (prev !== null && prev > 0 ? prev - 1 : 11))}
              className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
              title="Nivel anterior"
            >
              <ArrowLeft size={13} />
            </button>
            <span className="text-[11px] font-mono text-neutral-400 px-2">
              L{selectedLevel} / 11
            </span>
            <button
              onClick={() => setSelectedLevel(prev => (prev !== null && prev < 11 ? prev + 1 : 0))}
              className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
              title="Nivel siguiente"
            >
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Compact 3-Column Bento Cards Grid with Shared Layout Morphing */}
      <div className="space-y-10">
        {displayedGrupos.map(({ nivel, nodes }) => (
          <div key={nivel} className="space-y-3.5">
            {/* Level Subheader */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-emerald-400 font-semibold">
                  Nivel {nivel}
                </span>
                <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-sans">
                  {NIVELES[nivel]}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">
                {nodes.length} {nodes.length === 1 ? 'nodo' : 'nodos'}
              </span>
            </div>

            {/* High-Density Bento Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {nodes.map(node => {
                const isConcept = node.tipo === 'concepto';
                const hasBreakage = Boolean(node.experiencia_texto);
                const firstImpl = node.implementaciones[0];

                return (
                  <motion.article
                    key={node.slug}
                    layoutId={`card-shell-${node.slug}`}
                    onClick={() => {
                      setDirection(1);
                      setInspectedSlug(node.slug);
                    }}
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ y: -2 }}
                    className="group relative cursor-pointer rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4 transition-colors hover:border-neutral-700 hover:bg-neutral-900/40 hover:shadow-[0_0_24px_rgba(0,0,0,0.5)] flex flex-col justify-between gap-3 select-none"
                  >
                    <div className="space-y-2">
                      {/* Card Top Row */}
                      <div className="flex items-center justify-between gap-2 text-xs font-mono">
                        <span className="text-neutral-500 text-[10px]">
                          [0{node.nivel}.{node.orden_sugerido || 1}]
                        </span>

                        <span className={`text-[9.5px] uppercase px-2 py-0.5 rounded-full border ${
                          isConcept
                            ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300'
                            : 'border-cyan-800/60 bg-cyan-950/40 text-cyan-300'
                        }`}>
                          {node.tipo}
                        </span>
                      </div>

                      {/* Card Title (with linked layoutId) */}
                      <motion.h4 
                        layoutId={`card-title-${node.slug}`}
                        className="text-sm font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors uppercase font-sans"
                      >
                        {node.nombre}
                      </motion.h4>

                      {/* Resuelve (Compact 2-3 lines) */}
                      <p className="text-xs text-neutral-400 font-light leading-relaxed line-clamp-3 font-sans">
                        {node.resuelve}
                      </p>
                    </div>

                    {/* Card Footer Badges */}
                    <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between gap-2 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 overflow-hidden truncate">
                        {hasBreakage && (
                          <span 
                            title="Tiene caso real 'Lo vi romperse' documentado"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/50 text-amber-400 text-[10px]"
                          >
                            <ShieldAlert size={10} />
                            <span>Caso real</span>
                          </span>
                        )}

                        {firstImpl && (
                          <span className="text-neutral-400 text-[10px] truncate">
                            {firstImpl.nombre} {firstImpl.last_version ? `v${firstImpl.last_version}` : ''}
                          </span>
                        )}
                      </div>

                      <span className="text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all text-[11px] flex items-center shrink-0">
                        <span>Ficha</span>
                        <ChevronRight size={12} />
                      </span>
                    </div>

                  </motion.article>
                );
              })}
            </div>

          </div>
        ))}
      </div>

      {/* 3. True Shared Layout Morphing Modal Dialog */}
      <AnimatePresence>
        {inspectedNode && (
          <div 
            key="roadmap-expandable-modal-overlay"
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none"
          >
            {/* Backdrop with Progressive Blur */}
            <motion.div
              key="roadmap-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setInspectedSlug(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md pointer-events-auto cursor-pointer"
            />

            {/* Morphing Window Frame:
                Uses layoutId when the inspected node is rendered in view, 
                with fallback spring animation if navigated across different filtered levels */}
            <motion.div
              key={`roadmap-modal-frame-${inspectedNode.slug}`}
              layoutId={isInspectedInView ? `card-shell-${inspectedNode.slug}` : undefined}
              initial={!isInspectedInView ? { opacity: 0, scale: 0.94, y: 16 } : undefined}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={!isInspectedInView ? { opacity: 0, scale: 0.94, y: 12 } : undefined}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              role="dialog"
              aria-modal="true"
              drag={isMobile ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.02, bottom: 0.55 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 75 || info.velocity.y > 300) {
                  setInspectedSlug(null);
                }
              }}
              className="pointer-events-auto relative z-10 w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl max-h-[92vh] sm:max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col touch-pan-y shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
            >
              {/* Volumetric Reactive Ambient Glow */}
              <div 
                className={`absolute inset-0 pointer-events-none transition-all duration-700 ease-out rounded-t-[28px] sm:rounded-3xl ${
                  inspectedNode.experiencia_texto
                    ? 'bg-[radial-gradient(ellipse_75%_50%_at_0%_0%,rgba(245,158,11,0.12),transparent_70%)]'
                    : inspectedNode.tipo === 'concepto'
                    ? 'bg-[radial-gradient(ellipse_75%_50%_at_0%_0%,rgba(16,185,129,0.14),transparent_70%)]'
                    : 'bg-[radial-gradient(ellipse_75%_50%_at_0%_0%,rgba(56,189,248,0.14),transparent_70%)]'
                }`}
              />

              {/* Mobile Swipe Handle */}
              <div className="w-12 h-1.5 bg-neutral-700/80 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

              {/* Header Row: Icon + Linked Title + Chevron Navigation + Close Button */}
              <div className="p-6 sm:p-7 pb-2 sm:pb-3 flex items-start justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div className="size-12 sm:size-14 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                    <FileCode size={24} className={fileInfo?.color || 'text-emerald-400'} strokeWidth={1.75} />
                  </div>

                  <div className="min-w-0">
                    <div className="overflow-hidden h-8 sm:h-9 flex items-center">
                      <motion.h3
                        layoutId={isInspectedInView ? `card-title-${inspectedNode.slug}` : undefined}
                        className="text-xl sm:text-3xl font-bold text-white tracking-tight truncate inline-block uppercase font-sans"
                      >
                        {inspectedNode.nombre}
                      </motion.h3>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-neutral-400">
                        Nivel {inspectedNode.nivel} · {NIVELES[inspectedNode.nivel]}
                      </span>
                      <span className="text-neutral-600">·</span>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                        inspectedNode.tipo === 'concepto'
                          ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300'
                          : 'border-cyan-800/60 bg-cyan-950/40 text-cyan-300'
                      }`}>
                        {inspectedNode.tipo}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Right Controls: Nav Chevrons + Close */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:flex items-center bg-neutral-900/80 border border-neutral-800 rounded-xl p-0.5">
                    <button
                      onClick={goToPrev}
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Nodo anterior (←)"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[10px] font-mono text-neutral-500 px-2 select-none">
                      {currentIndex + 1} / {totalCount}
                    </span>
                    <button
                      onClick={goToNext}
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Nodo siguiente (→)"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => setInspectedSlug(null)}
                    className="size-8 sm:size-9 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                    title="Cerrar (Esc)"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Container: 
                  Fades in softly after shell expansion to eliminate any text stretching */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, delay: 0.05 }}
                className="flex-1 px-6 sm:px-7 lg:px-8 py-4 overflow-y-auto flex flex-col gap-5 sm:gap-6 scrollbar-thin scrollbar-thumb-neutral-800 relative z-10"
              >
                {/* Section 1: Qué Resuelve */}
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="text-neutral-500 uppercase tracking-wider font-semibold text-[11px]">
                    // 01. QUÉ RESUELVE
                  </div>
                  <p className="font-sans text-neutral-200 text-sm md:text-base font-light leading-relaxed">
                    {inspectedNode.resuelve}
                  </p>
                </div>

                {/* Section 2: Criterio de Dominio */}
                <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/15 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-medium uppercase tracking-wider">
                    <CheckCircle2 size={14} />
                    <span>02. Criterio de Dominio: Lo dominás cuando</span>
                  </div>
                  <p className="text-sm text-neutral-200 font-light leading-relaxed font-sans">
                    {inspectedNode.dominado_cuando}
                  </p>
                </div>

                {/* Section 3: "Lo Vi Romperse" (Incidente de Producción) */}
                <div className="space-y-1.5">
                  <div className="text-neutral-500 font-mono uppercase tracking-wider font-semibold text-[11px]">
                    // 03. CASO DE PRODUCCIÓN (LO VI ROMPERSE)
                  </div>
                  {inspectedNode.experiencia_texto ? (
                    <div className="p-4 rounded-xl border border-amber-900/50 bg-amber-950/20 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-medium uppercase">
                          <ShieldAlert size={14} />
                          <span>Incidente Verificado en Producción</span>
                        </div>
                        {inspectedNode.experiencia_link && (
                          <a
                            href={inspectedNode.experiencia_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 underline underline-offset-2"
                          >
                            <span>Ver commit en GitHub</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed font-sans">
                        {inspectedNode.experiencia_texto}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-neutral-800 text-neutral-500 text-xs font-mono">
                      Todavía no lo practiqué — cuando falle en producción, acá va la autopsia real documentada.
                    </div>
                  )}
                </div>

                {/* Section 4: Grafo Topológico (Prereqs & Desbloqueos) */}
                <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                  <div className="text-neutral-500 font-mono uppercase tracking-wider font-semibold text-[11px]">
                    // 04. TOPOLOGÍA DEL GRAFO (DAG)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Prereqs */}
                    <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-2">
                      <span className="text-[11px] font-mono text-neutral-400 block uppercase">
                        Requiere antes ({prereqs.length}):
                      </span>
                      {prereqs.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {prereqs.map(reqSlug => {
                            const reqNode = nodeMap.get(reqSlug);
                            return (
                              <button
                                key={reqSlug}
                                onClick={() => {
                                  setDirection(-1);
                                  setInspectedSlug(reqSlug);
                                }}
                                className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-emerald-400 text-xs font-mono transition-colors flex items-center gap-1 group"
                              >
                                <span>{reqNode?.nombre || reqSlug}</span>
                                <ArrowRight size={10} className="text-neutral-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-neutral-500">Nodo raíz (Sin dependencias previas)</span>
                      )}
                    </div>

                    {/* Desbloquea */}
                    <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-2">
                      <span className="text-[11px] font-mono text-neutral-400 block uppercase">
                        Desbloquea después ({dependents.length}):
                      </span>
                      {dependents.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {dependents.map(depSlug => {
                            const depNode = nodeMap.get(depSlug);
                            return (
                              <button
                                key={depSlug}
                                onClick={() => {
                                  setDirection(1);
                                  setInspectedSlug(depSlug);
                                }}
                                className="px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-900/50 hover:bg-emerald-900/60 text-emerald-300 text-xs font-mono transition-colors flex items-center gap-1 group"
                              >
                                <span>{depNode?.nombre || depSlug}</span>
                                <ArrowRight size={10} className="text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-neutral-500">Nodo terminal</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 5: Implementaciones Conectadas */}
                {inspectedNode.implementaciones && inspectedNode.implementaciones.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                    <div className="text-neutral-500 font-mono uppercase tracking-wider font-semibold text-[11px]">
                      // 05. IMPLEMENTACIONES CONECTADAS AL PIPELINE
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {inspectedNode.implementaciones.map(impl => (
                        <div
                          key={impl.nombre}
                          className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/70 text-xs font-mono flex items-center gap-2"
                        >
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          <span className="text-white font-medium">{impl.nombre}</span>
                          {impl.last_version && (
                            <span className="text-emerald-400">v{impl.last_version}</span>
                          )}
                          {impl.proveedor && (
                            <span className="text-[10px] text-neutral-500 uppercase">[{impl.proveedor}]</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 6: Fuentes Curadas */}
                {inspectedNode.fuentes && inspectedNode.fuentes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                    <div className="text-neutral-500 font-mono uppercase tracking-wider font-semibold text-[11px]">
                      // 06. DÓNDE APRENDERLO (FUENTES OFICIALES)
                    </div>
                    <ul className="space-y-2">
                      {inspectedNode.fuentes.map(f => (
                        <li key={f.url} className="text-xs font-mono flex items-start gap-2 text-neutral-400">
                          <span className="text-emerald-400 mt-0.5">→</span>
                          <div>
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-neutral-200 hover:text-emerald-300 underline underline-offset-2 break-all"
                            >
                              {f.url}
                            </a>
                            <p className="mt-0.5 text-neutral-400 font-sans font-light">
                              {f.por_que}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </motion.div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-4 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between gap-3 relative z-10">
                <span className="text-xs font-mono text-neutral-500 hidden sm:inline">
                  Navega con flechas <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300">→</kbd> · <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300">Esc</kbd>
                </span>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => {
                      onOpenIde(inspectedNode.slug);
                      setInspectedSlug(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-medium text-xs font-mono transition-colors flex items-center gap-1.5"
                  >
                    <FolderTree size={13} className="text-emerald-400" />
                    <span>Abrir en Modo IDE</span>
                  </button>

                  <button
                    onClick={() => setInspectedSlug(null)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs font-mono hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    Listo
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
