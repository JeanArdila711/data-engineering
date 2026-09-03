'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { RoadmapNode } from '@/lib/roadmap';
import { 
  Network, 
  ArrowRight, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Tag, 
  Sparkles,
  Layers,
  ShieldAlert,
  Sliders
} from 'lucide-react';

const NIVELES: Record<number, string> = {
  0: 'Base', 1: 'Modelo mental', 2: 'Ingesta', 3: 'Almacenamiento',
  4: 'Almacenamiento analítico', 5: 'Transformación y modelado',
  6: 'Orquestación', 7: 'Streaming', 8: 'Garantías de entrega',
  9: 'Procesamiento distribuido', 10: 'Nube', 11: 'Transversales',
};

// Cluster color mapping inspired by Obsidian Graph View screenshot
function getNodeColor(node: RoadmapNode): { color: string; glow: string } {
  // Key Root Hubs
  if (node.slug === 'sql' || node.slug === 'python-para-datos' || node.slug === 'ciclo-de-vida-del-dato') {
    return { color: '#ffffff', glow: 'rgba(255, 255, 255, 0.4)' };
  }
  // Level 0 & 1: Base & Mental Model (Green / Emerald)
  if (node.nivel <= 1) {
    return { color: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' };
  }
  // Level 2 & 3: Ingestion & Storage Layout (Orange / Amber)
  if (node.nivel <= 3) {
    return { color: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' };
  }
  // Level 4 & 5: Analytical Storage & Modeling (Purple / Violet)
  if (node.nivel <= 5) {
    return { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' };
  }
  // Level 6 & 7: Orchestration & Streaming (Cyan / Teal)
  if (node.nivel <= 7) {
    return { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' };
  }
  // Level 8, 9, 10, 11: Advanced Delivery, Distributed & Cloud (Ruby / Rose)
  return { color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)' };
}

interface SimNode {
  slug: string;
  nombre: string;
  tipo: string;
  nivel: number;
  radius: number;
  color: string;
  glow: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  degree: number;
  node: RoadmapNode;
  hasBreakage: boolean;
}

interface SimLink {
  source: string;
  target: string;
  distance: number;
  isPrereq: boolean;
}

interface RoadmapGraphViewProps {
  nodes: RoadmapNode[];
  activeSlug: string;
  onSelectNode: (slug: string) => void;
  onOpenIde: (slug: string) => void;
  dependentsMap: Map<string, string[]>;
}

export default function RoadmapGraphView({
  nodes,
  activeSlug,
  onSelectNode,
  onOpenIde,
  dependentsMap,
}: RoadmapGraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport transformation (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<RoadmapNode | null>(null);

  // Dragging state
  const draggingNodeRef = useRef<SimNode | null>(null);
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Simulation nodes and links stored in ref for 60fps physics
  const simNodesRef = useRef<Map<string, SimNode>>(new Map());
  const simLinksRef = useRef<SimLink[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // 1. Initialize Simulation Nodes & Clusters
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 900;
    const height = 620;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodeMap = new Map<string, RoadmapNode>();
    nodes.forEach(n => nodeMap.set(n.slug, n));

    // Calculate degree
    const degrees = new Map<string, number>();
    nodes.forEach(n => {
      degrees.set(n.slug, (degrees.get(n.slug) || 0) + n.prerequisitos.length);
      n.prerequisitos.forEach(p => {
        degrees.set(p, (degrees.get(p) || 0) + 1);
      });
    });

    const newSimNodes = new Map<string, SimNode>();
    nodes.forEach((node, idx) => {
      const deg = degrees.get(node.slug) || 1;
      const { color, glow } = getNodeColor(node);
      
      // Initial orbital distribution by level
      const angle = (node.nivel * 0.55) + (idx * (Math.PI * 2 / nodes.length));
      const dist = 70 + node.nivel * 28 + (idx % 3) * 20;
      
      // Node radius: hubs are larger
      let radius = 5.5 + Math.min(6, deg * 0.9);
      if (node.slug === 'sql' || node.slug === 'python-para-datos' || node.slug === 'ciclo-de-vida-del-dato') {
        radius = 11;
      }

      newSimNodes.set(node.slug, {
        slug: node.slug,
        nombre: node.nombre,
        tipo: node.tipo,
        nivel: node.nivel,
        radius,
        color,
        glow,
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        degree: deg,
        node,
        hasBreakage: Boolean(node.experiencia_texto),
      });
    });

    // Generate links
    const newLinks: SimLink[] = [];
    nodes.forEach(node => {
      node.prerequisitos.forEach(prereqSlug => {
        if (newSimNodes.has(prereqSlug)) {
          newLinks.push({
            source: prereqSlug,
            target: node.slug,
            distance: 85,
            isPrereq: true,
          });
        }
      });

      // Subtle intra-cluster springs to hold same-level nodes together (like Obsidian constellations)
      const sameLevel = nodes.filter(n => n.nivel === node.nivel && n.slug !== node.slug);
      if (sameLevel.length > 0 && Math.random() > 0.4) {
        newLinks.push({
          source: node.slug,
          target: sameLevel[0].slug,
          distance: 100,
          isPrereq: false,
        });
      }
    });

    simNodesRef.current = newSimNodes;
    simLinksRef.current = newLinks;
  }, [nodes]);

  // 2. Main Physics Simulation & Canvas Rendering Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const centerX = width / 2;
    const centerY = height / 2;

    const simNodes = Array.from(simNodesRef.current.values());
    const simLinks = simLinksRef.current;
    const nodeMap = simNodesRef.current;

    // --- PHYSICS STEP (Forces) ---
    // Repulsion (Coulomb)
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const a = simNodes[i];
        const b = simNodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);

        if (dist < 320) {
          const force = (320 - dist) / dist * 0.22;
          if (a !== draggingNodeRef.current) { a.vx -= (dx / dist) * force; a.vy -= (dy / dist) * force; }
          if (b !== draggingNodeRef.current) { b.vx += (dx / dist) * force; b.vy += (dy / dist) * force; }
        }
      }
    }

    // Link Attraction (Hooke's law)
    simLinks.forEach(link => {
      const a = nodeMap.get(link.source);
      const b = nodeMap.get(link.target);
      if (!a || !b) return;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - link.distance) * (link.isPrereq ? 0.024 : 0.008);

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (a !== draggingNodeRef.current) { a.vx += fx; a.vy += fy; }
      if (b !== draggingNodeRef.current) { b.vx -= fx; b.vy -= fy; }
    });

    // Center Gravity
    simNodes.forEach(n => {
      if (n === draggingNodeRef.current) return;
      n.vx += (centerX - n.x) * 0.0018;
      n.vy += (centerY - n.y) * 0.0018;

      // Damping friction
      n.vx *= 0.88;
      n.vy *= 0.88;

      n.x += n.vx;
      n.y += n.vy;
    });

    // --- RENDER PASS ---
    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Apply viewport transform (pan & zoom)
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // Active & Hovered connections
    const currentHoverSlug = hoveredNode?.slug;
    const prereqSet = new Set(hoveredNode?.prerequisitos || []);
    const depSet = new Set(currentHoverSlug ? (dependentsMap.get(currentHoverSlug) || []) : []);

    // 1. Draw Links (Edges)
    simLinks.forEach(link => {
      const a = nodeMap.get(link.source);
      const b = nodeMap.get(link.target);
      if (!a || !b) return;

      const isConnectedToHover = currentHoverSlug && (
        (link.source === currentHoverSlug && link.target && depSet.has(link.target)) ||
        (link.target === currentHoverSlug && link.source && prereqSet.has(link.source))
      );

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      if (isConnectedToHover) {
        ctx.strokeStyle = link.source === currentHoverSlug ? '#f59e0b' : '#10b981';
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = 0.9;
      } else if (currentHoverSlug) {
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.15;
      } else {
        ctx.strokeStyle = link.isPrereq ? '#383838' : '#222222';
        ctx.lineWidth = link.isPrereq ? 1.0 : 0.6;
        ctx.globalAlpha = link.isPrereq ? 0.45 : 0.2;
      }

      ctx.stroke();
    });

    // 2. Draw Nodes
    simNodes.forEach(n => {
      const isHovered = n.slug === currentHoverSlug;
      const isPrereq = prereqSet.has(n.slug);
      const isDep = depSet.has(n.slug);
      const isDimmed = currentHoverSlug && !isHovered && !isPrereq && !isDep;

      ctx.globalAlpha = isDimmed ? 0.18 : 1.0;

      // Outer glow for hub/hovered nodes
      if (isHovered || n.radius >= 10) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + (isHovered ? 7 : 4), 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? 'rgba(52, 211, 153, 0.25)' : n.glow;
        ctx.fill();
      }

      // Inner Node Circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#ffffff' : n.color;
      ctx.fill();

      // Border outline
      ctx.strokeStyle = isHovered ? '#10b981' : '#000000';
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.stroke();

      // Lo vi romperse warning ring
      if (n.hasBreakage) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Node Label (Visible on hover, on hubs, or when showLabels is enabled)
      const shouldDrawLabel = showLabels || isHovered || isPrereq || isDep || n.radius >= 10;
      if (shouldDrawLabel && (!isDimmed || isHovered)) {
        ctx.font = isHovered ? 'bold 11px monospace' : '9.5px monospace';
        ctx.fillStyle = isHovered ? '#ffffff' : '#a3a3a3';
        ctx.textAlign = 'center';
        ctx.fillText(n.nombre, n.x, n.y + n.radius + 12);
      }
    });

    ctx.restore();

    animFrameIdRef.current = requestAnimationFrame(render);
  }, [transform, hoveredNode, showLabels, dependentsMap]);

  // Start Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = containerRef.current?.clientWidth || 900;
      const height = 620;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [render]);

  // 3. Mouse Interaction Handlers (Hover, Drag, Pan, Zoom)
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    // Invert pan and scale
    return {
      x: (clientX - transform.x) / transform.scale,
      y: (clientY - transform.y) / transform.scale,
    };
  };

  const findNodeAt = (pos: { x: number; y: number }): SimNode | null => {
    const simNodes = Array.from(simNodesRef.current.values());
    for (let i = simNodes.length - 1; i >= 0; i--) {
      const n = simNodes[i];
      const dx = n.x - pos.x;
      const dy = n.y - pos.y;
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
        return n;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e);
    const hitNode = findNodeAt(pos);

    if (hitNode) {
      draggingNodeRef.current = hitNode;
      hitNode.vx = 0;
      hitNode.vy = 0;
      onSelectNode(hitNode.slug);
    } else {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e);

    // If dragging a node
    if (draggingNodeRef.current) {
      draggingNodeRef.current.x = pos.x;
      draggingNodeRef.current.y = pos.y;
      draggingNodeRef.current.vx = 0;
      draggingNodeRef.current.vy = 0;
      return;
    }

    // If panning canvas
    if (isPanningRef.current) {
      setTransform(t => ({
        ...t,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      }));
      return;
    }

    // Hover detection
    const hitNode = findNodeAt(pos);
    if (hitNode) {
      if (hoveredNode?.slug !== hitNode.slug) {
        setHoveredNode(hitNode.node);
      }
    } else if (hoveredNode) {
      setHoveredNode(null);
    }
  };

  const handleMouseUp = () => {
    draggingNodeRef.current = null;
    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform(t => {
      const newScale = Math.max(0.4, Math.min(2.2, t.scale * zoomFactor));
      return { ...t, scale: newScale };
    });
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div ref={containerRef} className="w-full rounded-2xl border border-neutral-800/90 bg-neutral-950 shadow-2xl overflow-hidden font-mono flex flex-col relative select-none">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800 gap-3 text-xs z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-emerald-400">
            <Network size={13} />
            <span className="font-semibold uppercase">Grafo Interconectado // Obsidian Graph</span>
          </div>
          <span className="text-neutral-500 text-[11px] hidden md:inline">
            34 Nodos · Físicas de Fuerza en Tiempo Real
          </span>
        </div>

        {/* Legend & Controls */}
        <div className="flex items-center gap-2 sm:gap-4 text-[11px] text-neutral-400">
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-white" />
              <span className="text-[10px]">Hubs</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="text-[10px]">Base</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-purple-400" />
              <span className="text-[10px]">Lakehouse</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-orange-400" />
              <span className="text-[10px]">Modelado</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-cyan-400" />
              <span className="text-[10px]">Streaming</span>
            </span>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-neutral-800">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-colors ${
                showLabels ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-500 hover:text-white'
              }`}
              title="Mostrar u ocultar nombres de nodos"
            >
              <Tag size={11} />
              <span>Labels</span>
            </button>

            <button
              onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.4, t.scale - 0.15) }))}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] text-neutral-500 font-mono w-7 text-center">
              {Math.round(transform.scale * 100)}%
            </span>
            <button
              onClick={() => setTransform(t => ({ ...t, scale: Math.min(2.2, t.scale + 0.15) }))}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={resetView}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="Centrar grafo"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Canvas Area */}
      <div className="relative w-full h-[620px] bg-[#101011] overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Floating HUD Card when hovering a node */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md p-4 rounded-xl border border-neutral-800 bg-neutral-950/95 backdrop-blur-md shadow-2xl space-y-2 z-20 pointer-events-auto font-mono">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-white text-xs">{hoveredNode.nombre}</span>
                <span className="text-[10px] text-neutral-500 uppercase">
                  L{hoveredNode.nivel} · {NIVELES[hoveredNode.nivel]}
                </span>
              </div>
              <button
                onClick={() => onOpenIde(hoveredNode.slug)}
                className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-[10px] font-mono hover:bg-emerald-900/60 transition-colors flex items-center gap-1"
              >
                <span>Abrir en IDE</span>
                <ArrowRight size={10} />
              </button>
            </div>

            <p className="text-xs text-neutral-300 font-sans font-light line-clamp-2 leading-relaxed">
              {hoveredNode.resuelve}
            </p>

            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1">
              <span>Requiere: <strong className="text-emerald-400">{hoveredNode.prerequisitos.length}</strong></span>
              <span>Desbloquea: <strong className="text-amber-400">{dependentsMap.get(hoveredNode.slug)?.length || 0}</strong></span>
              {hoveredNode.experiencia_texto && (
                <span className="text-amber-400 flex items-center gap-0.5 font-medium">
                  <ShieldAlert size={11} />
                  <span>Lo vi romperse</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="px-4 py-2 bg-neutral-900/70 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Arrastra cualquier nodo para probar las físicas · Rueda del mouse para zoom · Arrastra el fondo para moverte</span>
        <span className="font-mono text-neutral-400">Click en nodo para abrir ficha técnica</span>
      </div>

    </div>
  );
}
