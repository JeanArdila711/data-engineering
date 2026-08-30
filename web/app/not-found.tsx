'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Workflow,
  GitBranch,
  Radio,
  Terminal,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  Layers,
  Sparkles,
  Home,
  Database,
  Cpu,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import ParticlesBackground from '@/components/ParticlesBackground';
import CommandPalette from '@/components/CommandPalette';
import { RevealButton } from '@/components/ui/reveal-button';
import { useToast } from '@/components/ui/toast';

const GLITCH_CHARS = '0123456789ABCDEF!@#$%^&*<>~';

// Map of known entities for Smart Route Matching
const KNOWN_ENTITIES: { keywords: string[]; name: string; targetHref: string; category: string }[] = [
  { keywords: ['iceberg', 'apache-iceberg'], name: 'Apache Iceberg', targetHref: '/#ecosystem', category: 'Table Format' },
  { keywords: ['dbt', 'dbt-core'], name: 'dbt Core', targetHref: '/#ecosystem', category: 'Transformación' },
  { keywords: ['spark', 'apache-spark', 'pyspark'], name: 'Apache Spark', targetHref: '/#ecosystem', category: 'Procesamiento' },
  { keywords: ['duckdb', 'duck'], name: 'DuckDB', targetHref: '/#ecosystem', category: 'In-Process SQL' },
  { keywords: ['trino', 'presto'], name: 'Trino', targetHref: '/#ecosystem', category: 'SQL Distribuido' },
  { keywords: ['dagster'], name: 'Dagster', targetHref: '/#ecosystem', category: 'Orquestación' },
  { keywords: ['kafka', 'apache-kafka'], name: 'Apache Kafka', targetHref: '/#ecosystem', category: 'Streaming' },
  { keywords: ['flink', 'apache-flink'], name: 'Apache Flink', targetHref: '/#ecosystem', category: 'Streaming Stateful' },
  { keywords: ['polars'], name: 'Polars', targetHref: '/#ecosystem', category: 'DataFrames Rust' },
  { keywords: ['airflow', 'apache-airflow'], name: 'Apache Airflow', targetHref: '/#ecosystem', category: 'Orquestación' },
  { keywords: ['articulos', 'articles', 'deep-dive', 'deepdive', 'art'], name: 'Deep-Dives Curados', targetHref: '/#articulos', category: 'Artículos' },
  { keywords: ['digest', 'semanal', 'noticias', 'weekly'], name: 'Digest Semanal', targetHref: '/#digest', category: 'Actividad 7D' },
  { keywords: ['manifiesto', 'manifesto', 'proposito'], name: 'Manifiesto DE', targetHref: '/#manifiesto', category: 'Propósito' },
];

interface DagNodeProps {
  id: string;
  title: string;
  subtitle: string;
  status: 'success' | 'failed' | 'recovery';
  statusText: string;
  latencyText?: string;
  href?: string;
  icon: React.ElementType;
  delay?: number;
  isTarget?: boolean;
}

function DagNode({
  title,
  subtitle,
  status,
  statusText,
  latencyText,
  href,
  icon: Icon,
  delay = 0,
  isTarget = false,
}: DagNodeProps) {
  const isFailed = status === 'failed';
  const isSuccess = status === 'success';

  const statusStyles = isFailed
    ? 'border-red-500/50 bg-red-950/20 shadow-[0_0_24px_rgba(239,68,68,0.15)] text-red-300'
    : isSuccess
    ? 'border-emerald-500/30 bg-neutral-950/80 text-neutral-300 hover:border-emerald-500/60'
    : 'border-cyan-500/40 bg-neutral-950/90 text-neutral-200 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] active:scale-[0.98]';

  const badgeStyles = isFailed
    ? 'bg-red-500/20 text-red-400 border-red-500/40'
    : isSuccess
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={!isFailed ? { scale: 1.02, y: -2 } : { scale: 1.01 }}
      whileTap={!isFailed ? { scale: 0.97 } : undefined}
      className={`relative p-3.5 sm:p-4 rounded-2xl border backdrop-blur-md transition-all duration-200 flex flex-col gap-1.5 sm:gap-2 w-full min-w-0 ${statusStyles} ${
        href ? 'cursor-pointer group' : 'cursor-default'
      }`}
    >
      {/* Target Marker Pill */}
      {isTarget && (
        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider uppercase font-bold bg-red-500 text-black shadow-md">
          TARGET_FAILED
        </span>
      )}

      {/* Header with Icon and Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`size-7 rounded-lg flex items-center justify-center border shrink-0 ${
              isFailed
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : isSuccess
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}
          >
            <Icon size={14} />
          </div>
          <span className="text-xs font-bold font-mono tracking-tight text-white truncate">{title}</span>
        </div>

        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${badgeStyles}`}>
          {statusText}
        </span>
      </div>

      {/* Subtitle / Desc */}
      <p className="text-[11px] font-mono text-neutral-400 line-clamp-1">{subtitle}</p>

      {/* Latency telemetry indicator */}
      {latencyText && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono mt-0.5">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            {isSuccess && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isSuccess ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`} />
          </span>
          <span className={isSuccess ? 'text-emerald-400/80 font-medium' : 'text-red-400/80 font-medium'}>
            {latencyText}
          </span>
        </div>
      )}

      {/* Call to action arrow if recovery */}
      {href && (
        <div className="flex items-center justify-end gap-1 text-[10px] font-mono text-cyan-400 mt-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
          <span>Reenganchar</span>
          <ArrowRight size={11} />
        </div>
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-2xl block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function NotFound() {
  const router = useRouter();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [displayCode, setDisplayCode] = useState('404');
  const [isScrambling, setIsScrambling] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showFullTrace, setShowFullTrace] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
      document.title = '404: Pipeline Interrumpido — DE Radar';
    }
  }, []);

  // Smart Matcher: detect if user typed a keyword in URL (e.g. /duckdb, /spark)
  const matchedEntity = useMemo(() => {
    if (!currentPath) return null;
    const cleanSegments = currentPath.toLowerCase().replace(/[^a-z0-9-]/g, ' ').split(/\s+/);
    for (const entity of KNOWN_ENTITIES) {
      if (entity.keywords.some((kw) => cleanSegments.some((seg) => seg.includes(kw)))) {
        return entity;
      }
    }
    return null;
  }, [currentPath]);

  // Text scramble / Decryption effect on 404 + Micro-shake
  const triggerScramble = useCallback(() => {
    if (isScrambling) return;
    setIsScrambling(true);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 240);

    let iterations = 0;
    const target = '404';

    const interval = setInterval(() => {
      setDisplayCode(
        target
          .split('')
          .map((char, index) => {
            if (index < iterations) {
              return target[index];
            }
            return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          })
          .join('')
      );

      if (iterations >= target.length) {
        clearInterval(interval);
        setDisplayCode('404');
        setIsScrambling(false);
      }
      iterations += 1 / 3;
    }, 40);
  }, [isScrambling]);

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerScramble();
    }, 300);
    return () => clearTimeout(timer);
  }, [triggerScramble]);

  // Global Keyboard shortcuts navigation (Esc / Backspace / H -> Home)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'Escape' || e.key === 'h' || e.key === 'H' || e.key === 'Backspace') {
        e.preventDefault();
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleOpenCommandPalette = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-command-palette'));
    }
  };

  const handleCopyTrace = async () => {
    const trace = `[Traceback - DE Radar Analytical DAG Execution]
Traceback (most recent call last):
  File "pipeline/router.py", line 42, in resolve_route
    target_node = catalog.get_materialized_view(route="${currentPath || '/404'}")
  File "transform/models/marts/catalog.py", line 118, in get_materialized_view
    raise RouteNotFoundError(f"Route '${currentPath || '/404'}' not materialized in dbt marts.")
pipeline.exceptions.RouteNotFoundError: [ERR_404_DEAD_LETTER_QUEUE] Route '${currentPath || '/404'}' is unresolvable.

Pipeline Telemetry State:
  - raw_source: [200 OK] (latency: 24ms)
  - dbt_transform: [200 OK] (latency: 12ms)
  - target_route: [404 FAILED] (timeout: >5000ms)
  - Downstream Payload: Rerouted to Dead Letter Queue (DLQ).
  - Timestamp: ${new Date().toISOString()}`;

    try {
      await navigator.clipboard.writeText(trace);
      setCopied(true);
      showToast('Traceback copiado al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Error al copiar trace');
    }
  };

  return (
    <main className="w-full min-h-screen flex flex-col justify-between items-center bg-black text-white relative overflow-x-hidden font-sans select-none pb-[env(safe-area-inset-bottom)]">
      <ParticlesBackground />
      <CommandPalette />

      {/* Atmospheric Pipeline Glows (scaled for mobile viewport) */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] md:w-[850px] h-[320px] sm:h-[450px] md:h-[600px] bg-[radial-gradient(ellipse,rgba(239,68,68,0.10)_0%,rgba(6,182,212,0.04)_40%,transparent_70%)] blur-2xl sm:blur-3xl z-0" 
      />

      {/* 1. Header Responsive */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between relative z-20">
        <Link 
          href="/" 
          className="group flex items-center gap-2.5 sm:gap-3 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg p-1"
        >
          <div className="size-8 sm:size-9 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 group-hover:shadow-[0_0_16px_rgba(52,211,153,0.2)] transition-all shrink-0">
            <Workflow size={16} className="text-emerald-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold tracking-tight font-heading flex items-center gap-1.5 text-neutral-100 truncate">
              DE Radar <span className="text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-normal">DAG</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-neutral-500 truncate">Pipeline Inspector</span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-950/20 text-amber-400 text-xs font-mono">
            <AlertTriangle size={13} className="animate-pulse" />
            <span>DAG: 1 NODO FALLIDO</span>
          </div>

          <button
            onClick={handleOpenCommandPalette}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 min-h-[38px] rounded-lg border border-neutral-800 bg-neutral-900/70 active:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="Abrir buscador universal"
          >
            <Search size={13} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-mono">Buscar</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] bg-neutral-800 rounded border border-neutral-700 text-neutral-400">⌘K</kbd>
          </button>
        </div>
      </header>

      {/* 2. Core DAG + Scramble 404 Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center text-center relative z-10 my-auto">
        
        {/* Decrypted 404 Badge with Micro-Shake Motion */}
        <div className="relative mb-4 sm:mb-5 flex flex-col items-center justify-center">
          
          {/* Outer radar pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute size-36 sm:size-48 rounded-full border border-red-500/20 bg-red-500/5 pointer-events-none"
          />

          {/* Interactive Decryption Card with Spring & Shake */}
          <motion.div
            animate={
              isShaking
                ? { x: [-3, 3, -2, 2, -1, 1, 0], y: [-1, 1, -1, 1, 0] }
                : { x: 0, y: 0 }
            }
            transition={{ duration: 0.24, ease: 'easeInOut' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={triggerScramble}
            title="Toca para reejecutar desencriptación"
            className="relative z-10 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-2xl sm:rounded-3xl border border-neutral-800 bg-neutral-950/90 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] cursor-pointer group active:border-red-500/40 transition-colors"
          >
            <div className="flex items-center justify-center gap-1">
              <span className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tighter font-heading bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-200 to-neutral-500 drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)] select-none">
                {displayCode}
              </span>
            </div>

            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-0.5">
              <span className="size-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-mono tracking-wider sm:tracking-widest uppercase text-red-400 font-semibold truncate">
                DEAD_LETTER_QUEUE // 404
              </span>
            </div>
          </motion.div>
        </div>

        {/* Narrative & Value Statement */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="space-y-1.5 sm:space-y-2 mb-5 sm:mb-6 max-w-2xl px-2"
        >
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight font-heading text-neutral-100 text-balance leading-tight">
            Pipeline Interrumpido: Nodo no materializado
          </h1>
          <p className="text-xs sm:text-base text-neutral-400 leading-relaxed text-balance">
            El DAG falló al resolver <code className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-red-400 font-mono text-[11px] sm:text-xs break-all">{currentPath || '/404'}</code>. Nodos upstream saludables; selecciona un nodo para reenganchar.
          </p>
        </motion.div>

        {/* Smart Route Matcher (Teletransportador inteligente en mobile & desktop) */}
        {matchedEntity && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-xl mb-6 p-3 sm:p-3.5 rounded-2xl border border-cyan-500/40 bg-cyan-950/20 backdrop-blur-md shadow-[0_0_24px_rgba(6,182,212,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="size-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Lightbulb size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                  Coincidencia Detectada
                </span>
                <span className="text-xs text-neutral-200 font-medium truncate">
                  ¿Buscabas <strong className="text-white underline decoration-cyan-400/50">{matchedEntity.name}</strong>?
                </span>
              </div>
            </div>

            <Link
              href={matchedEntity.targetHref}
              className="px-3 py-2 sm:py-1.5 min-h-[38px] rounded-xl sm:rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs hover:bg-cyan-400 active:bg-cyan-300 transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Abrir en Radar</span>
              <ExternalLink size={12} />
            </Link>
          </motion.div>
        )}

        {/* --- Interactive Directed Acyclic Graph (DAG) --- */}
        <div className="w-full max-w-4xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-neutral-800/90 bg-neutral-950/70 backdrop-blur-xl shadow-2xl relative overflow-hidden mb-6 sm:mb-8">
          
          {/* Subtle Grid Canvas Mask */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40 pointer-events-none" />

          {/* Upstream & Failed Nodes Flow */}
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
            
            {/* Step 1: Upstream Ingestion */}
            <div className="w-full md:w-auto flex flex-col items-center">
              <DagNode
                id="source"
                title="raw_source"
                subtitle="GitHub & RSS Feeds"
                status="success"
                statusText="200 OK"
                latencyText="● 24ms (active)"
                icon={Database}
                delay={0.15}
              />
            </div>

            {/* Desktop Connector 1 -> 2 (Horizontal SVG) */}
            <div className="hidden md:flex items-center justify-center text-neutral-600">
              <svg width="48" height="24" viewBox="0 0 48 24" className="overflow-visible">
                <line x1="0" y1="12" x2="48" y2="12" stroke="rgba(52,211,153,0.4)" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="24" cy="12" r="3" fill="#34d399">
                  <animate attributeName="cx" from="0" to="48" dur="1.8s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            {/* Mobile Connector 1 -> 2 (Vertical SVG) */}
            <div className="flex md:hidden items-center justify-center py-1 text-emerald-400">
              <svg width="24" height="28" viewBox="0 0 24 28" className="overflow-visible">
                <line x1="12" y1="0" x2="12" y2="28" stroke="rgba(52,211,153,0.4)" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="12" cy="14" r="2.5" fill="#34d399">
                  <animate attributeName="cy" from="0" to="28" dur="1.4s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            {/* Step 2: dbt Transformation */}
            <div className="w-full md:w-auto flex flex-col items-center">
              <DagNode
                id="dbt"
                title="dbt_transform"
                subtitle="Dimensional Marts"
                status="success"
                statusText="200 OK"
                latencyText="● 12ms (active)"
                icon={GitBranch}
                delay={0.25}
              />
            </div>

            {/* Desktop Connector 2 -> 3 (Broken Line) */}
            <div className="hidden md:flex items-center justify-center text-red-500">
              <svg width="48" height="24" viewBox="0 0 48 24" className="overflow-visible">
                <line x1="0" y1="12" x2="48" y2="12" stroke="rgba(239,68,68,0.7)" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="24" cy="12" r="3" fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            {/* Mobile Connector 2 -> 3 (Broken Vertical SVG) */}
            <div className="flex md:hidden items-center justify-center py-1 text-red-500">
              <svg width="24" height="28" viewBox="0 0 24 28" className="overflow-visible">
                <line x1="12" y1="0" x2="12" y2="28" stroke="rgba(239,68,68,0.7)" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="12" cy="14" r="2.5" fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            {/* Step 3: Failed Target Node */}
            <div className="w-full md:w-auto flex flex-col items-center">
              <DagNode
                id="target"
                title="target_route"
                subtitle={currentPath || '/404'}
                status="failed"
                statusText="404 FAILED"
                latencyText="● timeout (>5000ms)"
                icon={XCircle}
                delay={0.35}
                isTarget={true}
              />
            </div>
          </div>

          {/* Forking Recovery Nodes */}
          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-neutral-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 sm:mb-4 text-left">
              <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
                <CornerDownRight size={14} className="text-cyan-400 shrink-0" />
                <span>Nodos downstream saludables (Toca para reanudar):</span>
              </span>
              <span className="self-start sm:self-auto text-[9px] sm:text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 font-medium">
                AUTO_REROUTE_READY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
              <DagNode
                id="mart_home"
                title="Radar Central"
                subtitle="mart_changelog & telemetría"
                status="recovery"
                statusText="HOME (/)"
                href="/"
                icon={Home}
                delay={0.4}
              />

              <DagNode
                id="mart_eco"
                title="Ecosistema"
                subtitle="10 Motores de Datos"
                status="recovery"
                statusText="RADAR"
                href="/#ecosystem"
                icon={Layers}
                delay={0.45}
              />

              <DagNode
                id="mart_art"
                title="Artículos Curados"
                subtitle="552 Deep-Dives Técnicos"
                status="recovery"
                statusText="DEEP-DIVES"
                href="/#articulos"
                icon={Sparkles}
                delay={0.5}
              />
            </div>
          </div>
        </div>

        {/* 3. Live Pipeline Log Box with Expandable Python Traceback */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="w-full max-w-2xl rounded-2xl border border-neutral-800/90 bg-neutral-950/80 backdrop-blur-md overflow-hidden text-left shadow-2xl mb-6 sm:mb-8 hover:border-neutral-700/80 transition-colors"
        >
          <div className="px-3.5 sm:px-4 py-2.5 border-b border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Terminal size={14} className="text-neutral-400 shrink-0" />
              <span className="text-xs font-mono text-neutral-300 font-medium truncate">pipeline_execution.log</span>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setShowFullTrace((prev) => !prev)}
                className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors py-1 px-2 rounded hover:bg-neutral-800/60"
              >
                <span>{showFullTrace ? 'Ocultar' : 'Ver trace'}</span>
                {showFullTrace ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              <button
                onClick={handleCopyTrace}
                className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-neutral-400 hover:text-emerald-400 transition-colors py-1 px-2 rounded hover:bg-neutral-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 font-mono text-[11px] sm:text-xs space-y-1.5 text-neutral-300 bg-black/40 overflow-x-auto">
            <div className="text-neutral-500">[INFO] Executing pipeline task instance: router.resolve()</div>
            <div className="text-red-400 font-semibold break-all">[ERROR] KeyError: Route &quot;{currentPath || '/404'}&quot; not found in DAG schema.</div>
            <div className="text-amber-300">[WARN] Upstream tasks succeeded. Payload routed to DLQ.</div>
            <div className="text-emerald-400">[RECOVERY] Click a healthy downstream node or press &quot;Reiniciar Pipeline&quot;.</div>

            {/* Expandable Traceback Section */}
            <AnimatePresence>
              {showFullTrace && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden pt-3 mt-3 border-t border-neutral-800/70 text-[10px] sm:text-[11px] text-neutral-400 font-mono space-y-1"
                >
                  <p className="text-red-400/90 font-bold">Traceback (most recent call last):</p>
                  <p className="pl-2 sm:pl-3 text-neutral-400">File <span className="text-amber-300">&quot;pipeline/router.py&quot;</span>, line 42, in resolve_route</p>
                  <p className="pl-4 sm:pl-6 text-neutral-300 break-all">target_node = catalog.get_materialized_view(route=&quot;{currentPath || '/404'}&quot;)</p>
                  <p className="pl-2 sm:pl-3 text-neutral-400">File <span className="text-amber-300">&quot;transform/models/marts/catalog.py&quot;</span>, line 118, in get_materialized_view</p>
                  <p className="pl-4 sm:pl-6 text-red-400 font-semibold break-all">raise RouteNotFoundError(f&quot;Route &apos;{currentPath || '/404'}&apos; not materialized in dbt marts.&quot;)</p>
                  <p className="text-red-400 font-bold">pipeline.exceptions.RouteNotFoundError: [ERR_404_DEAD_LETTER_QUEUE] Route is unresolvable.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* 4. Action Buttons (Optimized for Mobile Touch) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none"
        >
          <RevealButton href="/" size="lg" className="w-full sm:w-auto shadow-[0_0_28px_rgba(255,255,255,0.18)] min-h-[48px]">
            Reiniciar Pipeline (Home)
          </RevealButton>

          <button
            onClick={handleOpenCommandPalette}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[48px] rounded-full border border-neutral-800 bg-neutral-900/60 active:bg-neutral-800 text-neutral-200 text-sm font-semibold font-mono transition-all w-full sm:w-auto hover:border-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Search size={15} className="text-emerald-400" />
            <span>Consultar Command Palette (⌘K)</span>
          </button>
        </motion.div>

      </section>

      {/* 5. Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 border-t border-neutral-900 text-neutral-500 text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 relative z-20">
        <div className="flex items-center gap-2 text-neutral-400 text-center sm:text-left">
          <Workflow size={14} className="text-cyan-400 shrink-0" />
          <span className="text-[11px] sm:text-xs">DE Radar · DAG Orchestrator Pipeline</span>
        </div>

        <div className="flex items-center gap-3 text-[10px] sm:text-[11px]">
          <span>Atajos:</span>
          <span className="flex items-center gap-1 text-neutral-400">
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">Esc</kbd>
            <span>Reiniciar</span>
          </span>
          <span className="flex items-center gap-1 text-neutral-400">
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">⌘K</kbd>
            <span>Buscador</span>
          </span>
        </div>
      </footer>
    </main>
  );
}
