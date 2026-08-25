'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useMotionTemplate } from 'framer-motion';
import { DigestEntry } from '@/lib/db';
import { 
  GitCommitHorizontal, 
  Newspaper, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  ArrowUpRight, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Layers3, 
  Calendar,
  Clock,
  Cpu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const customEase = [0.16, 1, 0.3, 1] as const;

// Categorization colors and badges matching DE Radar visual system
const CATEGORY_THEME: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  'query-engine': { 
    label: 'Motor Analítico', 
    badgeClass: 'text-cyan-300 bg-cyan-950/50 border-cyan-800/60',
    dotClass: 'bg-cyan-400'
  },
  'dataframes': { 
    label: 'DataFrames SIMD', 
    badgeClass: 'text-blue-300 bg-blue-950/50 border-blue-800/60',
    dotClass: 'bg-blue-400'
  },
  'transformation': { 
    label: 'Transformación', 
    badgeClass: 'text-orange-300 bg-orange-950/50 border-orange-800/60',
    dotClass: 'bg-orange-400'
  },
  'orchestration': { 
    label: 'Orquestación', 
    badgeClass: 'text-purple-300 bg-purple-950/50 border-purple-800/60',
    dotClass: 'bg-purple-400'
  },
  'storage-lakehouse': { 
    label: 'Open Lakehouse', 
    badgeClass: 'text-emerald-300 bg-emerald-950/50 border-emerald-800/60',
    dotClass: 'bg-emerald-400'
  },
  'streaming': { 
    label: 'Streaming en Vivo', 
    badgeClass: 'text-teal-300 bg-teal-950/50 border-teal-800/60',
    dotClass: 'bg-teal-400'
  },
  'distributed-compute': { 
    label: 'Cómputo Distribuido', 
    badgeClass: 'text-amber-300 bg-amber-950/50 border-amber-800/60',
    dotClass: 'bg-amber-400'
  },
};

function cleanSummary(text: string | null): string {
  if (!text) return '';
  return text
    // Remove conversational preambles like "Aquí tienes la traducción exacta:" or "Aquí tienes la traducción:"
    .replace(/^(aquí tienes (la traducción|el resumen|un resumen)[^:\n]*:?\s*|here is the (translation|summary)[^:\n]*:?\s*)/i, '')
    // Remove conversational notes block at the end like "*(Nota: ...)*"
    .replace(/\*?\s*\(?Nota:[\s\S]*?\)?\*?$/i, '')
    // Remove leading/trailing quotes or markdown blockquotes
    .replace(/^["'>\s]+|["'\s]+$/g, '')
    .trim();
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 24) return `hace ${Math.max(1, diffHours)}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'ayer';
    return `hace ${diffDays}d`;
  } catch {
    return 'esta semana';
  }
}

// High-End Cybernetic Radar Capsule Digest Card — "Telemetry Wake-Up" hover
function DigestCard({ entry, lang }: { entry: DigestEntry; lang: 'es' | 'en' }) {
  const [isHovered, setIsHovered] = useState(false);
  const hasBreaking = entry.breaking_count_7d > 0;
  const totalActivity = entry.release_count_7d + entry.article_count_7d;
  const theme = CATEGORY_THEME[entry.category] || {
    label: entry.category,
    badgeClass: 'text-neutral-300 bg-neutral-900 border-neutral-700',
    dotClass: 'bg-neutral-400'
  };

  // ── Capa 0: Border trace — conic gradient that sweeps 360° once on hover ──
  const accentRgb = hasBreaking ? '239,68,68' : '52,211,153';
  const borderAngle = useMotionValue(0);
  const borderOpacity = useMotionValue(0);
  const borderBackground = useMotionTemplate`conic-gradient(from ${borderAngle}deg at 50% 50%, transparent 0%, rgba(${accentRgb},0.7) 6%, transparent 14%, transparent 100%)`;

  const handleHoverStart = () => {
    setIsHovered(true);
    // Reset and fire the border trace sweep
    borderAngle.set(0);
    animate(borderOpacity, 1, { duration: 0.15, ease: 'easeOut' });
    animate(borderAngle, 360, {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    });
  };

  const handleHoverEnd = () => {
    setIsHovered(false);
    // Fade out the trace overlay (don't reverse — just disappear)
    animate(borderOpacity, 0, { duration: 0.3, ease: 'easeIn' });
  };

  const handleOpenToolModal = () => {
    // Dispatch global event to open tool modal in EcosystemSection
    window.dispatchEvent(new CustomEvent('open-tool-modal', { detail: { tool_slug: entry.tool_slug } }));
    // Smooth scroll to ecosystem section
    const el = document.getElementById('ecosystem');
    if (el) {
      const navbarHeight = 80;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementPosition - navbarHeight),
        behavior: 'smooth',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      transition={{ duration: 0.35, ease: customEase }}
      className={`group relative rounded-2xl p-[1px] flex flex-col justify-between ${
        hasBreaking
          ? 'bg-gradient-to-b from-red-500/30 via-neutral-900/60 to-neutral-950/80'
          : 'bg-gradient-to-b from-neutral-800/80 via-neutral-900/50 to-neutral-950/80'
      }`}
    >
      {/* ── Capa 0: Animated border trace overlay ── */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: borderBackground,
          opacity: borderOpacity,
        }}
      />

      {/* Inner Surface Container — brightness lift on hover, no spotlight */}
      <div
        className={`relative z-10 w-full h-full rounded-[15px] bg-neutral-950/95 p-6 md:p-7 flex flex-col justify-between backdrop-blur-md border overflow-hidden
          transition-[background-color,border-color] duration-[250ms] ease-out
          motion-reduce:transition-none
          ${hasBreaking
            ? 'border-neutral-850/80 group-hover:bg-neutral-950/88 group-hover:border-red-800/40'
            : 'border-neutral-850/80 group-hover:bg-neutral-950/88 group-hover:border-neutral-700/50'
          }`}
      >
        {/* ── Capa 5: Breaking-change scanline — NOW driven by isHovered state ──
             Bug fix: was using whileHover on a pointer-events:none div (never fired) */}
        {hasBreaking && (
          <motion.div
            aria-hidden
            initial={{ x: '-120%' }}
            animate={isHovered ? { x: '220%' } : { x: '-120%' }}
            transition={isHovered
              ? { duration: 0.65, ease: 'easeInOut' }
              : { duration: 0 }
            }
            className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-red-500/20 to-transparent z-0"
          />
        )}

        <div className="relative z-10 flex flex-col gap-5">
          
          {/* Header Row: Tool Identity & 7D Velocity */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* ── Capa 2: Tool Logo Badge — LED pulse glow on hover ── */}
              <div className={`size-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm border shadow-inner
                transition-shadow duration-[400ms] ease-out motion-reduce:transition-none overflow-hidden
                ${hasBreaking 
                  ? 'bg-red-950/60 border-red-800/60 text-red-300 group-hover:shadow-[0_0_10px_rgba(239,68,68,0.25)]' 
                  : 'bg-neutral-900 border-neutral-800 text-emerald-400 group-hover:shadow-[0_0_10px_rgba(52,211,153,0.25)]'
                }`}>
                <img 
                  src={`/logos/${entry.tool_slug}.svg`} 
                  alt={`${entry.tool_name} logo`}
                  className="size-5 opacity-90 transition-opacity duration-300 group-hover:opacity-100 object-contain"
                />
              </div>

              <div className="flex flex-col">
                {/* ── Capa 7: Title — NO color change on hover, subtle text-shadow only ── */}
                <h3 className="text-lg font-bold text-white tracking-tight transition-[text-shadow] duration-300 ease-out group-hover:[text-shadow:0_0_20px_rgba(255,255,255,0.06)]">
                  {entry.tool_name}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border w-fit mt-0.5 ${theme.badgeClass}`}>
                  <span className={`size-1 rounded-full ${theme.dotClass}`} />
                  <span>{theme.label}</span>
                </span>
              </div>
            </div>

            {/* ── Capa 4: Velocity Pulse Badge — single heartbeat blip on card hover ── */}
            <div className="flex flex-col items-end gap-1">
              <motion.span
                animate={isHovered
                  ? { scale: [1, 1.06, 1] }
                  : { scale: 1 }
                }
                transition={isHovered
                  ? { duration: 0.45, times: [0, 0.35, 1], ease: 'easeOut' }
                  : { duration: 0.2 }
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border ${
                  hasBreaking
                    ? 'bg-red-950/60 border-red-800/60 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.15)]'
                }`}
              >
                <span className={`size-1.5 rounded-full animate-pulse ${hasBreaking ? 'bg-red-400' : 'bg-emerald-400'}`} />
                <span>{totalActivity} EVENTO{totalActivity !== 1 ? 'S' : ''} 7D</span>
              </motion.span>
            </div>
          </div>

          {/* Breaking Change Warning Banner (If Present) */}
          {hasBreaking && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-mono">
              <ShieldAlert size={15} className="text-red-400 shrink-0 animate-bounce" />
              <span><strong>Atención:</strong> Breaking changes detectados en las últimas 24-48h.</span>
            </div>
          )}

          {/* ── Capa 3: Dual Telemetry Track Bento Body — staggered left-border activation ── */}
          <div className="flex flex-col gap-3">
            
            {/* Track 1: Releases Feed (activates at 0ms) */}
            <div className={`rounded-xl p-3.5 flex flex-col gap-2
              bg-neutral-900/50 border border-neutral-800/80
              border-l-2 border-l-transparent
              transition-[border-color,background-color] duration-200 ease-out
              motion-reduce:transition-none
              ${hasBreaking
                ? 'group-hover:border-l-red-500/50 group-hover:bg-neutral-900/60'
                : 'group-hover:border-l-emerald-500/50 group-hover:bg-neutral-900/60'
              }`}>
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <GitCommitHorizontal size={13} className="text-emerald-400" />
                  <strong className="text-neutral-200">Releases (7D):</strong>
                </span>
                <span className="text-neutral-500">
                  {entry.release_count_7d} versión{entry.release_count_7d !== 1 ? 'es' : ''}
                </span>
              </div>

              {entry.releases_7d && entry.releases_7d.length > 0 ? (
                <div className="flex flex-col gap-2 mt-0.5">
                  {entry.releases_7d.slice(0, 2).map((rel, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/60 text-xs font-mono">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-white px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[11px]">
                          {rel.version}
                        </span>
                        {rel.has_breaking ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                            BREAKING
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400/90">
                            Estable
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500 hidden sm:inline">
                          · {formatRelativeTime(rel.published_at)}
                        </span>
                      </div>

                      <a
                        href={rel.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors shrink-0 p-1 rounded hover:bg-neutral-800/60"
                        title="Ver release notes oficial"
                      >
                        <span>Notas</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] font-mono text-neutral-500 italic py-1">
                  Sin nuevos releases en los últimos 7 días.
                </div>
              )}
            </div>

            {/* Track 2: Curated Deep-Dives Feed (activates at +40ms stagger) */}
            <div
              className={`rounded-xl p-3.5 flex flex-col gap-2
                bg-neutral-900/50 border border-neutral-800/80
                border-l-2 border-l-transparent
                transition-[border-color,background-color] duration-200 ease-out
                motion-reduce:transition-none
                ${hasBreaking
                  ? 'group-hover:border-l-red-500/50 group-hover:bg-neutral-900/60'
                  : 'group-hover:border-l-emerald-500/50 group-hover:bg-neutral-900/60'
                }`}
              style={{ transitionDelay: '40ms' }}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Newspaper size={13} className="text-cyan-400" />
                  <strong className="text-neutral-200">Deep-Dives & Artículos:</strong>
                </span>
                <span className="text-neutral-500">
                  {entry.article_count_7d} pub{entry.article_count_7d !== 1 ? 's' : ''}
                </span>
              </div>

              {entry.top_articles_7d && entry.top_articles_7d.length > 0 ? (
                <div className="flex flex-col gap-2 mt-0.5">
                  {entry.top_articles_7d.slice(0, 2).map((art) => {
                    const rawSummary = lang === 'es' 
                      ? (art.summary_es || art.summary_en)
                      : (art.summary_en || art.summary_es);
                    const summary = rawSummary ? cleanSummary(rawSummary) : null;

                    return (
                      <div key={art.article_id} className="p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800/60 flex flex-col gap-1.5">
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-neutral-200 hover:text-emerald-300 transition-colors flex items-start justify-between gap-2 group/art"
                        >
                          <span className="line-clamp-2 leading-snug">{art.title}</span>
                          <ExternalLink size={12} className="shrink-0 mt-0.5 text-neutral-500 group-hover/art:text-emerald-400 transition-colors" />
                        </a>
                        {summary && (
                          <p className="text-[11px] text-neutral-400 font-light leading-relaxed line-clamp-2">
                            {summary}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[11px] font-mono text-neutral-500 italic py-1">
                  Sin nuevos deep-dives publicados en 7 días.
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Capa 6: Card Footer Action Bar — CTA ghost → semi-filled reveal ── */}
        <div className="relative z-10 pt-4 mt-4 border-t border-neutral-800/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500">
            <Clock size={11} className="text-neutral-600" />
            <span>Telemetry Sync · 7D</span>
          </div>

          <button
            onClick={handleOpenToolModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium
              text-white bg-neutral-900 border border-neutral-750
              transition-all duration-[250ms] ease-out cursor-pointer active:scale-95 shadow-sm
              motion-reduce:transition-none
              group-hover:bg-neutral-800/60 group-hover:border-emerald-500/40 group-hover:text-emerald-200
              group-hover:shadow-[0_0_12px_rgba(52,211,153,0.08)]"
            style={{ transitionDelay: '80ms' }}
          >
            <span>Ver en Radar</span>
            <ArrowUpRight size={13} className="text-neutral-400 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>

      </div>
    </motion.div>
  );
}

export default function DigestSection({ entries = [] }: { entries?: DigestEntry[] }) {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState(0);
  const ITEMS_PER_PAGE = 3;

  const items = entries;

  // Reset page to 1 when entries change
  useEffect(() => {
    setCurrentPage(1);
    setDirection(0);
  }, [entries]);

  // Listen to global language change from Hero
  useEffect(() => {
    const handleGlobalLang = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang: 'es' | 'en' }>;
      if (customEvent.detail?.lang) {
        setLang(customEvent.detail.lang);
      }
    };
    window.addEventListener('change-language', handleGlobalLang);
    return () => window.removeEventListener('change-language', handleGlobalLang);
  }, []);

  // Compute Weekly Aggregated Metrics for HUD Banner
  const totalReleases7D = items.reduce((acc, curr) => acc + curr.release_count_7d, 0);
  const totalBreaking7D = items.reduce((acc, curr) => acc + curr.breaking_count_7d, 0);
  const totalArticles7D = items.reduce((acc, curr) => acc + curr.article_count_7d, 0);
  const activeEngines7D = items.filter(i => (i.release_count_7d + i.article_count_7d) > 0).length;

  // Pagination slicing
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setDirection(newPage > currentPage ? 1 : -1);
    setCurrentPage(newPage);
  };

  const pageVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 36 : dir < 0 ? -36 : 0,
      opacity: 0,
      filter: 'blur(3px)',
      scale: 0.99,
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
      scale: 1,
      transition: {
        duration: 0.3,
        ease: customEase,
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -36 : dir < 0 ? 36 : 0,
      opacity: 0,
      filter: 'blur(3px)',
      scale: 0.99,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1] as const,
      },
    }),
  };

  return (
    <section id="digest" className="w-full max-w-7xl mx-auto px-5 sm:px-6 py-16 sm:py-20 lg:py-28 relative scroll-mt-28">
      
      {/* 1. Header with Eyebrow and Headline */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 md:mb-12 border-b border-neutral-800/80 pb-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-400 w-fit">
            <Zap size={13} className="text-emerald-400" />
            <span>[04] // TELEMETRÍA SEMANAL · 7D PULSE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-white uppercase">
            Lo Que Pasó <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-500">
              Esta Semana.
            </span>
          </h2>

          <p className="text-neutral-400 text-sm md:text-base font-light leading-relaxed mt-1">
            Actividad consolidada de los últimos 7 días en el ecosistema: releases oficiales, alertas de breaking changes y deep-dives técnicos curados.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs font-mono text-neutral-400 self-start md:self-end">
          <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Radar 7D: <strong className="text-white uppercase">Sincronizado</strong></span>
        </div>
      </div>

      {/* 2. Mission Control Weekly Metric Ribbon HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-10">
        
        {/* Metric 1: Total Releases */}
        <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex flex-col gap-1 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>Releases (7D)</span>
            <GitCommitHorizontal size={14} className="text-emerald-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
            +{totalReleases7D}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">versiones publicadas</span>
        </div>

        {/* Metric 2: Breaking Changes */}
        <div className={`p-4 rounded-xl border flex flex-col gap-1 backdrop-blur-sm ${
          totalBreaking7D > 0 
            ? 'bg-red-950/30 border-red-800/60 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
            : 'bg-neutral-950/80 border-neutral-800/80'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={totalBreaking7D > 0 ? 'text-red-300 font-bold' : 'text-neutral-400'}>
              Breaking Changes
            </span>
            {totalBreaking7D > 0 ? (
              <AlertTriangle size={14} className="text-red-400" />
            ) : (
              <ShieldCheck size={14} className="text-emerald-400" />
            )}
          </div>
          <span className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
            totalBreaking7D > 0 ? 'text-red-400' : 'text-white'
          }`}>
            {totalBreaking7D > 0 ? totalBreaking7D : '0'}
          </span>
          <span className={`text-[10px] font-mono ${totalBreaking7D > 0 ? 'text-red-400/80 font-semibold' : 'text-emerald-400/80'}`}>
            {totalBreaking7D > 0 ? 'alertas activas' : 'ecosistema estable 🛡️'}
          </span>
        </div>

        {/* Metric 3: Deep-Dives */}
        <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex flex-col gap-1 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>Deep-Dives (7D)</span>
            <Sparkles size={14} className="text-cyan-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
            +{totalArticles7D}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">artículos técnicos</span>
        </div>

        {/* Metric 4: Active Engines */}
        <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex flex-col gap-1 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>Motores Activos</span>
            <Activity size={14} className="text-purple-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
            {activeEngines7D}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">con actividad semanal</span>
        </div>

      </div>

      {/* 3. Digest Grid of Cybernetic Radar Capsules with Silk Direction-Aware Animation */}
      <motion.div 
        layout="position"
        transition={{ duration: 0.35, ease: customEase }}
        className="relative overflow-hidden w-full min-h-[360px]"
      >
        {items.length === 0 ? (
          <div className="w-full py-16 text-center rounded-2xl border border-neutral-800/80 bg-neutral-950/50 p-8">
            <Activity size={24} className="mx-auto text-neutral-600 mb-3" />
            <p className="text-neutral-400 text-sm font-mono">
              Sin actividad registrada en los últimos 7 días.
            </p>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={`digest-page-${currentPage}`}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 w-full"
              >
                {paginatedItems.map((entry) => (
                  <DigestCard key={entry.tool_slug} entry={entry} lang={lang} />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* 4. High-End Interactive Pagination Bar (agent-10 & agent-13) */}
            {totalPages > 1 && (
              <motion.div 
                layout
                transition={{ duration: 0.35, ease: customEase }}
                className="mt-10 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                {/* Telemetry Counter */}
                <div className="text-xs font-mono text-neutral-500 flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Mostrando <strong className="text-neutral-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> - <strong className="text-neutral-200">{Math.min(currentPage * ITEMS_PER_PAGE, items.length)}</strong> de <strong className="text-neutral-200">{items.length}</strong> motores con actividad
                  </span>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 p-1 rounded-xl shadow-inner select-none">
                  {/* Previous Button */}
                  <motion.button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    whileHover={currentPage !== 1 ? { scale: 1.04 } : {}}
                    whileTap={currentPage !== 1 ? { scale: 0.94 } : {}}
                    aria-label="Página anterior"
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                      currentPage === 1
                        ? 'text-neutral-600 opacity-40 cursor-not-allowed'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer'
                    }`}
                  >
                    <ChevronLeft size={14} />
                    <span className="hidden sm:inline">Anterior</span>
                  </motion.button>

                  {/* Page Pills */}
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const isCurrent = currentPage === pageNum;

                      return (
                        <motion.button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          aria-label={`Ir a página ${pageNum}`}
                          className={`relative size-8 rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-colors cursor-pointer ${
                            isCurrent
                              ? 'text-emerald-300 font-bold'
                              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
                          }`}
                        >
                          {isCurrent && (
                            <motion.div
                              layoutId="active-digest-page-pill"
                              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                              className="absolute inset-0 rounded-lg bg-emerald-950/80 border border-emerald-500/60 shadow-[0_0_14px_rgba(52,211,153,0.22)] z-0"
                            />
                          )}
                          <span className="relative z-10">{pageNum}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <motion.button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    whileHover={currentPage !== totalPages ? { scale: 1.04 } : {}}
                    whileTap={currentPage !== totalPages ? { scale: 0.94 } : {}}
                    aria-label="Página siguiente"
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'text-neutral-600 opacity-40 cursor-not-allowed'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer'
                    }`}
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight size={14} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

    </section>
  );
}
