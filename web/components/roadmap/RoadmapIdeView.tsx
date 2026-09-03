'use client';

import React, { useState, useMemo } from 'react';
import type { RoadmapNode } from '@/lib/roadmap';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileCode,
  FileText,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Terminal,
  Layers,
  Sparkles,
  Search,
  Flag,
  Check
} from 'lucide-react';
import BotonSabido from '@/components/roadmap/BotonSabido';

const NIVELES: Record<number, string> = {
  0: 'Base', 1: 'Modelo mental', 2: 'Ingesta', 3: 'Almacenamiento',
  4: 'Almacenamiento analítico', 5: 'Transformación y modelado',
  6: 'Orquestación', 7: 'Streaming', 8: 'Garantías de entrega',
  9: 'Procesamiento distribuido', 10: 'Nube', 11: 'Transversales',
};

// Helper for realistic IDE extensions
export function getNodeFileName(node: RoadmapNode): { name: string; ext: string; color: string } {
  const slug = node.slug;
  if (slug.includes('sql') || slug === 'data-warehouse') {
    return { name: `${slug}.sql`, ext: 'sql', color: 'text-cyan-400' };
  }
  if (slug.includes('python') || slug === 'ingesta-desacoplada' || slug.includes('spark') || slug.includes('dags')) {
    return { name: `${slug}.py`, ext: 'py', color: 'text-amber-400' };
  }
  if (slug.includes('parquet') || slug.includes('columnar')) {
    return { name: `${slug}.parquet`, ext: 'parquet', color: 'text-purple-400' };
  }
  if (slug.includes('git') || slug.includes('linea-de-comandos')) {
    return { name: `${slug}.sh`, ext: 'sh', color: 'text-emerald-400' };
  }
  if (slug.includes('docker') || slug.includes('contenedores')) {
    return { name: `${slug}.dockerfile`, ext: 'docker', color: 'text-blue-400' };
  }
  if (slug.includes('dbt') || slug.includes('ci-cd') || slug.includes('contratos')) {
    return { name: `${slug}.yaml`, ext: 'yaml', color: 'text-rose-400' };
  }
  if (slug.includes('streaming') || slug.includes('eventos')) {
    return { name: `${slug}.stream`, ext: 'stream', color: 'text-yellow-400' };
  }
  return { name: `${slug}.concept`, ext: 'concept', color: 'text-emerald-400' };
}

interface RoadmapIdeViewProps {
  grupos: { nivel: number; nodes: RoadmapNode[] }[];
  activeSlug: string;
  onSelectNode: (slug: string) => void;
  dependentsMap: Map<string, string[]>;
  nodeMap: Map<string, RoadmapNode>;
  notas?: Record<string, string>;
  frontera?: Set<string>;
  sabidosSet?: Set<string>;
  togglables?: Set<string>;
  onToggleSabido?: (slug: string) => void;
}

export default function RoadmapIdeView({
  grupos,
  activeSlug,
  onSelectNode,
  dependentsMap,
  nodeMap,
  notas = {},
  frontera = new Set<string>(),
  sabidosSet = new Set<string>(),
  togglables = new Set<string>(),
  onToggleSabido,
}: RoadmapIdeViewProps) {
  // Folders open state: default all open or open current node's folder
  const activeNode = nodeMap.get(activeSlug) || grupos[0]?.nodes[0];
  const [openFolders, setOpenFolders] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    grupos.forEach(g => { initial[g.nivel] = true; });
    return initial;
  });

  const toggleFolder = (nivel: number) => {
    setOpenFolders(prev => ({ ...prev, [nivel]: !prev[nivel] }));
  };

  const fileInfo = activeNode ? getNodeFileName(activeNode) : { name: 'index.ts', ext: 'ts', color: 'text-neutral-400' };
  const prereqs = activeNode?.prerequisitos || [];
  const dependents = activeNode ? (dependentsMap.get(activeNode.slug) || []) : [];

  return (
    <div className="w-full rounded-2xl border border-neutral-800/90 bg-neutral-950 shadow-2xl overflow-hidden font-mono flex flex-col md:flex-row min-h-[640px]">
      
      {/* 1. Left Sidebar: Folder & File Tree (Matching User's Reference) */}
      <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-neutral-800/80 bg-neutral-950/90 flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="px-4 py-3 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/60 text-xs">
          <div className="flex items-center gap-2 text-neutral-400 font-semibold tracking-wider uppercase text-[11px]">
            <Terminal size={13} className="text-emerald-400" />
            <span>Explorador // Grafo</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">
            {grupos.reduce((n, g) => n + g.nodes.length, 0)} Nodos
          </span>
        </div>

        {/* Tree Root */}
        <div className="p-3 overflow-y-auto max-h-[300px] md:max-h-[600px] scrollbar-thin text-xs select-none">
          <div className="mb-2 px-2 flex items-center gap-1.5 text-neutral-500 text-[11px] font-mono">
            <FolderOpen size={13} className="text-neutral-400" />
            <span>rumbo-workspace/</span>
          </div>

          <div className="space-y-1 pl-2">
            {grupos.map(({ nivel, nodes }) => {
              const isOpen = openFolders[nivel] ?? true;
              const hasActiveNode = nodes.some(n => n.slug === activeSlug);

              return (
                <div key={nivel} className="space-y-0.5">
                  {/* Folder Item */}
                  <button
                    onClick={() => toggleFolder(nivel)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-colors group ${
                      hasActiveNode ? 'text-white' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
                    }`}
                  >
                    <span className="text-neutral-600 group-hover:text-neutral-400 transition-transform">
                      {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </span>
                    <span className="text-emerald-500/80">
                      {isOpen ? <FolderOpen size={14} /> : <Folder size={14} />}
                    </span>
                    <span className="font-mono text-xs truncate">
                      {String(nivel).padStart(2, '0')}_{NIVELES[nivel]?.toLowerCase().replace(/\s+/g, '_') || `nivel_${nivel}`}
                    </span>
                    <span className="ml-auto text-[10px] text-neutral-600 font-mono">
                      {nodes.length}
                    </span>
                  </button>

                  {/* Files Inside Folder */}
                  {isOpen && (
                    <div className="pl-5 space-y-0.5 border-l border-neutral-800/50 ml-3">
                      {nodes.map(node => {
                        const isCurrent = node.slug === activeSlug;
                        const { name, color } = getNodeFileName(node);
                        const hasBreakage = Boolean(node.experiencia_texto);

                        return (
                          <button
                            key={node.slug}
                            onClick={() => onSelectNode(node.slug)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all ${
                              isCurrent
                                ? 'bg-neutral-800 text-white font-medium shadow-sm border border-neutral-700/60'
                                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
                            }`}
                          >
                            <FileCode size={13} className={color} />
                            <span className="truncate text-xs font-mono">{name}</span>

                            {frontera.has(node.slug) && (
                              <span
                                title="Podés arrancar acá: no tiene prerequisitos pendientes"
                                className="ml-auto shrink-0 size-1.5 rounded-full bg-emerald-400"
                              />
                            )}
                            {/* Badge if it has "Lo vi romperse" evidence */}
                            {hasBreakage && (
                              <span
                                title="Tiene caso real 'Lo vi romperse' documentado"
                                className={`shrink-0 size-1.5 rounded-full bg-amber-400 ${frontera.has(node.slug) ? '' : 'ml-auto'}`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* 2. Right Editor Buffer: Node Inspection View */}
      <main className="flex-1 flex flex-col bg-neutral-950/95 overflow-hidden">
        
        {/* Editor Tab Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/80 border-b border-neutral-800">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 px-3 py-1 rounded-t-md bg-neutral-950 border-t-2 border-emerald-400 border-x border-neutral-800 text-xs text-white">
              <FileCode size={13} className={fileInfo.color} />
              <span className="font-semibold">{fileInfo.name}</span>
            </div>
            <span className="text-neutral-600 text-xs hidden sm:inline">
              rumbo &gt; {String(activeNode?.nivel || 0).padStart(2, '0')}_{NIVELES[activeNode?.nivel || 0]} &gt; {fileInfo.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
              activeNode?.tipo === 'concepto'
                ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300'
                : 'border-cyan-800/60 bg-cyan-950/40 text-cyan-300'
            }`}>
              {activeNode?.tipo || 'nodo'}
            </span>
          </div>
        </div>

        {/* Editor Content Area with Line Numbers */}
        <div className="flex-1 p-5 md:p-8 overflow-y-auto space-y-6 font-sans">
          
          {/* Header Title */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1.5">
              <span>// NODO [0{activeNode?.nivel}.{activeNode?.orden_sugerido || 1}]</span>
              <span>·</span>
              <span className="uppercase text-neutral-400">{NIVELES[activeNode?.nivel || 0]}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase font-sans">
              {activeNode?.nombre}
            </h3>
            {activeNode && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {frontera.has(activeNode.slug) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 text-[10px] font-mono uppercase">
                    <Flag size={10} />
                    Podés arrancar acá
                  </span>
                )}
                {onToggleSabido && togglables.has(activeNode.slug) && (
                  <BotonSabido sabido={sabidosSet.has(activeNode.slug)} onClick={() => onToggleSabido(activeNode.slug)} />
                )}
              </div>
            )}
            {activeNode && notas[activeNode.slug] && (
              <p className="mt-2 text-xs font-mono text-neutral-500">// {notas[activeNode.slug]}</p>
            )}
          </div>

          {/* Section 1: Qué Resuelve */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="text-neutral-500 font-semibold tracking-wider uppercase text-[11px]">
              // 01. QUÉ RESUELVE
            </div>
            <p className="font-sans text-neutral-300 text-sm md:text-base font-light leading-relaxed">
              {activeNode?.resuelve}
            </p>
          </div>

          {/* Section 2: Lo Dominás Cuando */}
          <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/15 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-medium uppercase tracking-wider">
              <CheckCircle2 size={13} />
              <span>02. Criterio de Dominio: Lo dominás cuando</span>
            </div>
            <p className="font-sans text-sm text-neutral-200 font-light leading-relaxed">
              {activeNode?.dominado_cuando}
            </p>
          </div>

          {/* Section 3: "Lo Vi Romperse" (Incidente Real o Marcador) */}
          <div className="space-y-1.5">
            <div className="text-neutral-500 font-mono font-semibold tracking-wider uppercase text-[11px]">
              // 03. CASO DE PRODUCCIÓN (LO VI ROMPERSE)
            </div>

            {activeNode?.experiencia_texto ? (
              <div className="p-4 rounded-xl border border-amber-900/50 bg-amber-950/20 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-medium uppercase">
                    <ShieldAlert size={14} />
                    <span>Incidente de Producción Verificado</span>
                  </div>
                  {activeNode.experiencia_link && (
                    <a
                      href={activeNode.experiencia_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 underline underline-offset-2"
                    >
                      <span>Ver commit / postmortem</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <p className="font-sans text-sm text-neutral-300 font-light leading-relaxed">
                  {activeNode.experiencia_texto}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/20 text-neutral-500 text-xs font-mono">
                Todavía no lo practiqué — cuando falle en producción, acá va la autopsia real sin adornos.
              </div>
            )}
          </div>

          {/* Section 4: Grafo de Dependencias (Prerrequisitos & Desbloqueos) */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="text-neutral-500 font-mono font-semibold tracking-wider uppercase text-[11px]">
              // 04. TOPOLOGÍA DEL GRAFO (DAG)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Prerrequisitos (Entrada) */}
              <div className="p-3.5 rounded-xl border border-neutral-800/80 bg-neutral-900/40 space-y-2">
                <span className="text-[11px] font-mono text-neutral-400 block uppercase">
                  Requiere antes ({prereqs.length}):
                </span>
                {prereqs.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {prereqs.map(reqSlug => {
                      const reqNode = nodeMap.get(reqSlug);
                      const sabido = sabidosSet.has(reqSlug);
                      return (
                        <button
                          key={reqSlug}
                          onClick={() => onSelectNode(reqSlug)}
                          title={sabido ? 'Ya lo sabés' : undefined}
                          className={`px-2.5 py-1 rounded-md border transition-colors text-xs font-mono flex items-center gap-1 group ${
                            sabido
                              ? 'border-neutral-800 bg-neutral-900/40 text-neutral-500 line-through hover:text-neutral-300'
                              : 'border-neutral-700/80 bg-neutral-800/80 hover:bg-neutral-700 hover:text-emerald-400 text-neutral-200'
                          }`}
                        >
                          {sabido && <Check size={10} className="text-emerald-500" />}
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

              {/* Desbloquea (Salida) */}
              <div className="p-3.5 rounded-xl border border-neutral-800/80 bg-neutral-900/40 space-y-2">
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
                          onClick={() => onSelectNode(depSlug)}
                          className="px-2.5 py-1 rounded-md border border-emerald-900/60 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 transition-colors text-xs font-mono flex items-center gap-1 group"
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

          {/* Section 5: Implementaciones Vivas */}
          {activeNode?.implementaciones && activeNode.implementaciones.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-neutral-800/80">
              <div className="text-neutral-500 font-mono font-semibold tracking-wider uppercase text-[11px]">
                // 05. IMPLEMENTACIONES CONECTADAS AL PIPELINE
              </div>
              <div className="flex flex-wrap gap-2">
                {activeNode.implementaciones.map(impl => (
                  <div
                    key={impl.nombre}
                    className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/70 flex items-center gap-2 text-xs font-mono"
                  >
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    <span className="text-white font-medium">{impl.nombre}</span>
                    {impl.last_version && (
                      <span className="text-emerald-400 text-[11px]">v{impl.last_version}</span>
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
          {activeNode?.fuentes && activeNode.fuentes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-neutral-800/80">
              <div className="text-neutral-500 font-mono font-semibold tracking-wider uppercase text-[11px]">
                // 06. DÓNDE APRENDERLO (FUENTES CON CRITERIO)
              </div>
              <ul className="space-y-2">
                {activeNode.fuentes.map(f => (
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

        </div>
      </main>

    </div>
  );
}
