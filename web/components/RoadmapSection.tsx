'use client';

import React, { useState, useMemo } from 'react';
import type { RoadmapNode } from '@/lib/roadmap';
import { ScrollRevealTitle } from '@/components/ui/scroll-reveal-title';
import RoadmapIdeView from '@/components/roadmap/RoadmapIdeView';
import RoadmapGraphView from '@/components/roadmap/RoadmapGraphView';
import RoadmapCardsView from '@/components/roadmap/RoadmapCardsView';
import { 
  FolderTree, 
  Network, 
  LayoutGrid, 
  Search, 
  ShieldAlert, 
  Layers, 
  Cpu, 
  X,
  SlidersHorizontal
} from 'lucide-react';

export default function RoadmapSection({
  grupos,
  notas = {},
  encabezado = true,
  sabidos = [],
  frontera = new Set<string>(),
  togglables = new Set<string>(),
  onToggleSabido,
}: {
  grupos: { nivel: number; nodes: RoadmapNode[] }[];
  notas?: Record<string, string>;
  encabezado?: boolean;
  /** Nodos de la ruta dados por sabidos (vía wizard o ?ya=). Sirven para resolver nombres de prerequisitos. */
  sabidos?: RoadmapNode[];
  /** Slugs que se pueden arrancar ya: sin prerequisitos pendientes. */
  frontera?: Set<string>;
  /** Slugs sobre los que el toggle "Ya sé esto" puede actuar (dentro de la ruta actual). */
  togglables?: Set<string>;
  /** Si viene, las vistas muestran el toggle "Ya sé esto". */
  onToggleSabido?: (slug: string) => void;
}) {
  // 1. View Mode State: 'ide' (Folder tree), 'graph' (Obsidian canvas), 'cards' (Classic bento)
  const [viewMode, setViewMode] = useState<'ide' | 'graph' | 'cards'>('ide');
  
  // 2. Selection & Filter State
  const [activeSlug, setActiveSlug] = useState<string>('idempotencia');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'incident' | 'concepto' | 'herramienta'>('all');

  // 3. Derived Lookups
  const allNodes = useMemo(() => grupos.flatMap(g => g.nodes), [grupos]);
  
  const nodeMap = useMemo(() => {
    const map = new Map<string, RoadmapNode>();
    [...allNodes, ...sabidos].forEach(n => map.set(n.slug, n));
    return map;
  }, [allNodes, sabidos]);

  const sabidosSet = useMemo(() => new Set(sabidos.map(n => n.slug)), [sabidos]);

  // Compute inverse dependencies (which nodes unlock/depend on slug)
  const dependentsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    allNodes.forEach(n => {
      n.prerequisitos.forEach(pSlug => {
        const list = map.get(pSlug) || [];
        list.push(n.slug);
        map.set(pSlug, list);
      });
    });
    return map;
  }, [allNodes]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allNodes.filter(node => {
      // Type Filter
      if (filterType === 'incident' && !node.experiencia_texto) return false;
      if (filterType === 'concepto' && node.tipo !== 'concepto') return false;
      if (filterType === 'herramienta' && node.tipo !== 'herramienta') return false;

      // Text Search
      if (!query) return true;
      const matchName = node.nombre.toLowerCase().includes(query);
      const matchSlug = node.slug.toLowerCase().includes(query);
      const matchResuelve = node.resuelve.toLowerCase().includes(query);
      const matchTools = node.implementaciones.some(i => i.nombre.toLowerCase().includes(query));

      return matchName || matchSlug || matchResuelve || matchTools;
    });
  }, [allNodes, searchQuery, filterType]);

  // Regroup filtered nodes
  const filteredGrupos = useMemo(() => {
    const byLevel: Record<number, RoadmapNode[]> = {};
    for (let i = 0; i <= 11; i++) byLevel[i] = [];

    filteredNodes.forEach(node => {
      byLevel[node.nivel] = byLevel[node.nivel] || [];
      byLevel[node.nivel].push(node);
    });

    return Object.entries(byLevel)
      .map(([lvl, nodes]) => ({ nivel: Number(lvl), nodes }))
      .filter(g => g.nodes.length > 0);
  }, [filteredNodes]);

  const handleOpenIdeWithNode = (slug: string) => {
    setActiveSlug(slug);
    setViewMode('ide');
  };

  const incidentCount = useMemo(() => allNodes.filter(n => n.experiencia_texto).length, [allNodes]);

  return (
    <section id="rumbo" className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      
      {/* Encabezado Principal */}
      {encabezado && (
        <div className="mb-8 border-t border-neutral-800/80 pt-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-400 w-fit">
            <span>[05.2] // GRAFO COMPLETO DE DEPENDENCIAS</span>
          </div>

          <ScrollRevealTitle
            text="El Grafo Completo"
            as="h2"
            className="text-2xl sm:text-4xl font-bold tracking-tight uppercase leading-[1.1] text-white"
          />

          <p className="text-sm md:text-base text-neutral-400 font-light max-w-3xl leading-relaxed">
            Los {allNodes.length} nodos ordenados topológicamente por nivel y prerequisitos, conectados a los datos vivos del pipeline.
            Explora la ruta en formato de <strong className="text-neutral-200 font-medium">IDE con árbol de archivos</strong>, navega el <strong className="text-neutral-200 font-medium">Grafo interactivo de Obsidian</strong> o inspecciona las fichas técnicas.
          </p>
        </div>
      )}

      {/* Control Bar: View Switcher Tabs + Instant Search & Filters */}
      <div className="mb-6 flex flex-col gap-3.5 pt-2">
        
        {/* Row 1: View Mode Switcher (IDE vs Grafo vs Cards) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
          
          <div className="flex items-center p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('ide')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                viewMode === 'ide'
                  ? 'bg-neutral-800 text-white font-medium shadow-[0_0_16px_rgba(255,255,255,0.06)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FolderTree size={14} className={viewMode === 'ide' ? 'text-emerald-400' : 'text-neutral-500'} />
              <span>Modo IDE (Carpetas)</span>
            </button>

            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                viewMode === 'graph'
                  ? 'bg-neutral-800 text-white font-medium shadow-[0_0_16px_rgba(255,255,255,0.06)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Network size={14} className={viewMode === 'graph' ? 'text-emerald-400' : 'text-neutral-500'} />
              <span>Grafo Obsidian</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-neutral-800 text-white font-medium shadow-[0_0_16px_rgba(255,255,255,0.06)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={14} className={viewMode === 'cards' ? 'text-emerald-400' : 'text-neutral-500'} />
              <span>Modo Fichas</span>
            </button>
          </div>

          <div className="text-xs font-mono text-neutral-500 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mostrando {filteredNodes.length} de {allNodes.length} nodos</span>
          </div>

        </div>

        {/* Row 2: Search Input and Filter Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por concepto o herramienta (ej: DuckDB, Airflow, SCD2, idempotencia)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-800 bg-neutral-950/80 text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/70 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-mono shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                filterType === 'all'
                  ? 'border-neutral-700 bg-neutral-800 text-white'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white'
              }`}
            >
              Todos ({allNodes.length})
            </button>

            <button
              onClick={() => setFilterType('incident')}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                filterType === 'incident'
                  ? 'border-amber-700/80 bg-amber-950/40 text-amber-300'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-amber-300'
              }`}
            >
              <ShieldAlert size={12} className="text-amber-400" />
              <span>Lo vi romperse ({incidentCount})</span>
            </button>

            <button
              onClick={() => setFilterType('concepto')}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                filterType === 'concepto'
                  ? 'border-emerald-700/80 bg-emerald-950/40 text-emerald-300'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-emerald-300'
              }`}
            >
              <Layers size={12} className="text-emerald-400" />
              <span>Conceptos</span>
            </button>

            <button
              onClick={() => setFilterType('herramienta')}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                filterType === 'herramienta'
                  ? 'border-cyan-700/80 bg-cyan-950/40 text-cyan-300'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-cyan-300'
              }`}
            >
              <Cpu size={12} className="text-cyan-400" />
              <span>Herramientas</span>
            </button>
          </div>
        </div>

      </div>

      {/* Dynamic Views Rendering */}
      {filteredNodes.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-neutral-800 text-center font-mono space-y-2">
          <p className="text-sm text-neutral-400">No se encontraron nodos con ese criterio de búsqueda.</p>
          <button
            onClick={() => { setSearchQuery(''); setFilterType('all'); }}
            className="text-xs text-emerald-400 underline underline-offset-4"
          >
            Limpiar filtros y ver todos los {allNodes.length} nodos
          </button>
        </div>
      ) : viewMode === 'ide' ? (
        <RoadmapIdeView
          grupos={filteredGrupos}
          activeSlug={activeSlug}
          onSelectNode={setActiveSlug}
          dependentsMap={dependentsMap}
          nodeMap={nodeMap}
          notas={notas}
          frontera={frontera}
          sabidosSet={sabidosSet}
          togglables={togglables}
          onToggleSabido={onToggleSabido}
        />
      ) : viewMode === 'graph' ? (
        <RoadmapGraphView
          nodes={filteredNodes}
          activeSlug={activeSlug}
          onSelectNode={setActiveSlug}
          onOpenIde={handleOpenIdeWithNode}
          dependentsMap={dependentsMap}
        />
      ) : (
        <RoadmapCardsView
          grupos={filteredGrupos}
          notas={notas}
          onOpenIde={handleOpenIdeWithNode}
          nodeMap={nodeMap}
          dependentsMap={dependentsMap}
          frontera={frontera}
          sabidosSet={sabidosSet}
          togglables={togglables}
          onToggleSabido={onToggleSabido}
        />
      )}

    </section>
  );
}
