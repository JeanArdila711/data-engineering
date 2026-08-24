'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useMotionTemplate, AnimatePresence } from 'framer-motion';
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
  Cpu
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

const SAMPLE_DIGEST: DigestEntry[] = [
  {
    tool_slug: 'duckdb',
    tool_name: 'DuckDB',
    category: 'query-engine',
    release_count_7d: 1,
    breaking_count_7d: 0,
    releases_7d: [{
      version: 'v1.5.0',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      has_breaking: false,
      source_url: 'https://github.com/duckdb/duckdb/releases',
    }],
    article_count_7d: 1,
    top_articles_7d: [{
      article_id: 1,
      title: 'Resultados de Consultas por Chunks en el Driver JDBC/Java',
      url: 'https://duckdb.org/2026/08/21/chunked-query-results-java-driver.html',
      summary_en: 'DuckDB introduces chunked query result streaming for Java and JDBC applications, drastically reducing client memory overhead.',
      summary_es: 'DuckDB introduce streaming de resultados por chunks para Java y JDBC, reduciendo drásticamente el consumo de memoria del cliente.',
    }],
  },
  {
    tool_slug: 'polars',
    tool_name: 'Polars',
    category: 'dataframes',
    release_count_7d: 1,
    breaking_count_7d: 1,
    releases_7d: [{
      version: 'v1.38.0',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      has_breaking: true,
      source_url: 'https://github.com/pola-rs/polars/releases',
    }],
    article_count_7d: 1,
    top_articles_7d: [{
      article_id: 2,
      title: 'Polars Streaming Engine v2: Arquitectura y Benchmarks de Alto Throughput',
      url: 'https://pola.rs/posts/streaming2-benchmarks',
      summary_en: 'In-depth performance breakdown of the new Streaming Engine 2.0 with out-of-core query execution.',
      summary_es: 'Desglose detallado del nuevo motor de streaming 2.0 con ejecución out-of-core optimizada en memoria.',
    }],
  },
  {
    tool_slug: 'iceberg',
    tool_name: 'Apache Iceberg',
    category: 'storage-lakehouse',
    release_count_7d: 1,
    breaking_count_7d: 0,
    releases_7d: [{
      version: 'v1.9.0',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      has_breaking: false,
      source_url: 'https://github.com/apache/iceberg/releases',
    }],
    article_count_7d: 1,
    top_articles_7d: [{
      article_id: 3,
      title: 'Evolución de Particiones y Tablas de Vistas en Apache Iceberg 1.9',
      url: 'https://iceberg.apache.org/blogs/iceberg-1.9-features',
      summary_en: 'New spec updates enabling partition evolution and multi-engine view metadata standardization.',
      summary_es: 'Nuevas especificaciones que permiten evolución de particiones y vistas estandarizadas multi-motor.',
    }],
  },
  {
    tool_slug: 'dbt-core',
    tool_name: 'dbt Core',
    category: 'transformation',
    release_count_7d: 1,
    breaking_count_7d: 0,
    releases_7d: [{
      version: 'v1.12.0',
      published_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
      has_breaking: false,
      source_url: 'https://github.com/dbt-labs/dbt-core/releases',
    }],
    article_count_7d: 1,
    top_articles_7d: [{
      article_id: 4,
      title: 'dbt Core v1.12 en General Availability: Rendimiento de Compilación y Testing',
      url: 'https://www.getdbt.com/blog/dbt-core-v1-12-is-ga',
      summary_en: 'dbt Core 1.12 delivers 3x faster manifest parsing and native unit testing improvements.',
      summary_es: 'dbt Core 1.12 ofrece parseo de manifiestos 3x más rápido y mejoras nativas de pruebas unitarias.',
    }],
  },
];

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

// High-End Cybernetic Radar Capsule Digest Card (agent-10 & agent-13)
function DigestCard({ entry, lang }: { entry: DigestEntry; lang: 'es' | 'en' }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  const hasBreaking = entry.breaking_count_7d > 0;
  const totalActivity = entry.release_count_7d + entry.article_count_7d;
  const theme = CATEGORY_THEME[entry.category] || { 
    label: entry.category, 
    badgeClass: 'text-neutral-300 bg-neutral-900 border-neutral-700',
    dotClass: 'bg-neutral-400' 
  };

  // GPU dynamic spotlight glow: Amber/Crimson if breaking changes, emerald otherwise
  const glowColor = hasBreaking ? 'rgba(239, 68, 68, 0.22)' : 'rgba(52, 211, 153, 0.2)';
  const spotlightBackground = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, ${glowColor}, transparent 80%)`;

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
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: customEase }}
      className={`group relative rounded-2xl p-[1px] transition-all duration-300 flex flex-col justify-between ${
        hasBreaking 
          ? 'bg-gradient-to-b from-red-500/30 via-neutral-900/60 to-neutral-950/80 hover:from-red-500/50' 
          : 'bg-gradient-to-b from-neutral-800/80 via-neutral-900/50 to-neutral-950/80 hover:from-emerald-500/40'
      }`}
    >
      {/* 1. GPU Spotlight Glow Layer */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
        style={{ background: spotlightBackground }}
      />

      {/* 2. Inner Surface Container */}
      <div className="relative z-10 w-full h-full rounded-[15px] bg-neutral-950/95 p-6 md:p-7 flex flex-col justify-between backdrop-blur-md border border-neutral-850/80 group-hover:border-neutral-700/80 transition-colors">
        
        <div className="flex flex-col gap-5">
          
          {/* Header Row: Tool Identity & 7D Velocity */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Tool Monogram Badge */}
              <div className={`size-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm border shadow-inner ${
                hasBreaking 
                  ? 'bg-red-950/60 border-red-800/60 text-red-300' 
                  : 'bg-neutral-900 border-neutral-800 text-emerald-400'
              }`}>
                {entry.tool_name.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                  {entry.tool_name}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border w-fit mt-0.5 ${theme.badgeClass}`}>
                  <span className={`size-1 rounded-full ${theme.dotClass}`} />
                  <span>{theme.label}</span>
                </span>
              </div>
            </div>

            {/* Velocity Pulse Badge */}
            <div className="flex flex-col items-end gap-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border ${
                hasBreaking 
                  ? 'bg-red-950/60 border-red-800/60 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                  : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.15)]'
              }`}>
                <span className={`size-1.5 rounded-full animate-pulse ${hasBreaking ? 'bg-red-400' : 'bg-emerald-400'}`} />
                <span>{totalActivity} EVENTO{totalActivity !== 1 ? 'S' : ''} 7D</span>
              </span>
            </div>
          </div>

          {/* Breaking Change Warning Banner (If Present) */}
          {hasBreaking && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-mono">
              <ShieldAlert size={15} className="text-red-400 shrink-0 animate-bounce" />
              <span><strong>Atención:</strong> Breaking changes detectados en las últimas 24-48h.</span>
            </div>
          )}

          {/* Dual Telemetry Track Bento Body */}
          <div className="flex flex-col gap-3">
            
            {/* Track 1: Releases Feed */}
            <div className="rounded-xl p-3.5 bg-neutral-900/50 border border-neutral-800/80 flex flex-col gap-2">
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

            {/* Track 2: Curated Deep-Dives Feed */}
            <div className="rounded-xl p-3.5 bg-neutral-900/50 border border-neutral-800/80 flex flex-col gap-2">
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
                    const summary = lang === 'es' 
                      ? (art.summary_es || art.summary_en)
                      : (art.summary_en || art.summary_es);

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

        {/* 3. Card Footer Action Bar */}
        <div className="pt-4 mt-4 border-t border-neutral-800/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500">
            <Clock size={11} className="text-neutral-600" />
            <span>Telemetry Sync · 7D</span>
          </div>

          <button
            onClick={handleOpenToolModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 hover:border-emerald-500/50 hover:text-emerald-300 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
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
  const items = entries.length > 0 ? entries : SAMPLE_DIGEST;

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

      {/* 3. Digest Grid of Cybernetic Radar Capsules */}
      {items.length === 0 ? (
        <div className="w-full py-16 text-center rounded-2xl border border-neutral-800/80 bg-neutral-950/50 p-8">
          <Activity size={24} className="mx-auto text-neutral-600 mb-3" />
          <p className="text-neutral-400 text-sm font-mono">
            Sin actividad registrada en los últimos 7 días.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {items.map((entry) => (
            <DigestCard key={entry.tool_slug} entry={entry} lang={lang} />
          ))}
        </div>
      )}

    </section>
  );
}
