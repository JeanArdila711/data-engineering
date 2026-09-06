'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DigestEntry } from '@/lib/db';
import { 
  GitCommitHorizontal, 
  Newspaper, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Clock,
  LayoutGrid,
  ListTree,
  RotateCcw,
  Flame,
  ArrowRight
} from 'lucide-react';
import { RevealButton } from '@/components/ui/reveal-button';
import { FlippingCard } from '@/components/ui/flipping-card';

const customEase = [0.16, 1, 0.3, 1] as const;

// Paleta semántica estandarizada por categoría técnica
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

// Sanitizador robusto: elimina comentarios meta-conversacionales de Gemini y formateos erráticos
function cleanSummary(text: string | null): string {
  if (!text) return '';
  return text
    .replace(/^(aquí tienes (la traducción|el resumen|un resumen)[^:\n]*:?\s*|here is the (translation|summary)[^:\n]*:?\s*)/i, '')
    .replace(/^el texto que proporcionaste ya está en español[^:\n]*:?\s*/i, '')
    .replace(/^como modelo de lenguaje[^:\n]*:?\s*/i, '')
    .replace(/\*?\s*\(?Nota:[\s\S]*?\)?\*?$/i, '')
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

interface DigestCardProps {
  entry: DigestEntry;
  lang: 'es' | 'en';
  isLead?: boolean;
}

// Tarjeta 3D interactiva (Hover Flip automático con perspectiva y profundidad Z)
function DigestCard({ entry, lang, isLead = false }: DigestCardProps) {
  const hasBreaking = entry.breaking_count_7d > 0;
  const hasReleases = entry.releases_7d && entry.releases_7d.length > 0;
  const hasArticles = entry.top_articles_7d && entry.top_articles_7d.length > 0;

  const theme = CATEGORY_THEME[entry.category] || {
    label: entry.category,
    badgeClass: 'text-neutral-300 bg-neutral-900 border-neutral-700',
    dotClass: 'bg-neutral-400',
  };

  const handleOpenToolModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('open-tool-modal', {
        detail: { slug: entry.tool_slug, tool_slug: entry.tool_slug },
      })
    );
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

  // 1. CARA FRONTAL: Resumen de versiones, estado de salud y prompt de hover
  const frontFace = (
    <div className="flex flex-col justify-between h-full w-full p-5 sm:p-6 select-none bg-transparent">
      <div className="flex flex-col gap-3">
        {/* Encabezado: Identidad del Motor y Cue Visual de Giro */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Monograma / Logo del Motor */}
            <div
              className={`size-11 rounded-xl flex items-center justify-center border shadow-inner transition-colors duration-200 overflow-hidden shrink-0 ${
                hasBreaking
                  ? 'bg-red-950/50 border-red-800/60'
                  : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <img
                src={`/logos/${entry.tool_slug}.svg`}
                alt={`${entry.tool_name} logo`}
                className="size-5 opacity-90 object-contain"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  {entry.tool_name}
                </h3>
                {isLead && !hasBreaking && (
                  <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/50 text-[10px] font-mono text-emerald-400">
                    <Flame size={10} />
                  </span>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border w-fit mt-0.5 ${theme.badgeClass}`}
              >
                <span className={`size-1 rounded-full ${theme.dotClass}`} />
                <span className="truncate">{theme.label}</span>
              </span>
            </div>
          </div>

          {/* Cue Visual: Indica que la tarjeta gira en 3D con hover */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border bg-neutral-900/90 border-neutral-800 text-neutral-400 transition-all duration-300 group-hover/flipping-card:border-cyan-700/60 group-hover/flipping-card:text-cyan-300 shrink-0">
            <span>Expediente</span>
            <span className="text-cyan-400 font-bold transition-transform duration-300 group-hover/flipping-card:rotate-45">↷</span>
          </div>
        </div>

        {/* Alerta de Breaking Change sobria */}
        {hasBreaking && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-mono">
            <ShieldAlert size={13} className="text-red-400 shrink-0" />
            <span className="text-[11px] leading-tight">
              <strong>Breaking change:</strong> Requiere migración técnica.
            </span>
          </div>
        )}

        {/* Lista de Releases Oficiales */}
        <div className="flex flex-col gap-2 pt-0.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span className="flex items-center gap-1.5">
              <GitCommitHorizontal size={13} className="text-emerald-400" />
              <strong className="text-neutral-200">Releases (7D):</strong>
            </span>
            <span className="text-neutral-500">
              {entry.release_count_7d} versión{entry.release_count_7d !== 1 ? 'es' : ''}
            </span>
          </div>

          {hasReleases ? (
            <div className="flex flex-col gap-1.5">
              {entry.releases_7d.slice(0, 3).map((rel, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-900/70 border border-neutral-800/70 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className="font-bold text-white px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[11px] shrink-0">
                      {rel.version}
                    </span>
                    {rel.has_breaking ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/80 shrink-0">
                        BREAKING
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400/90 shrink-0">
                        Estable
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-500 truncate hidden sm:inline">
                      · {formatRelativeTime(rel.published_at)}
                    </span>
                  </div>

                  <span className="text-[10px] text-neutral-500 font-mono">
                    {rel.has_breaking ? 'alerta' : 'nominal'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800/60 text-xs font-mono text-neutral-400 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>Sin versiones nuevas esta semana · Operación nominal.</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Cara Frontal: Indicador de Hover */}
      <div className="pt-3 mt-3 border-t border-neutral-800/70 flex items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-neutral-500">
          <Clock size={11} className="text-neutral-600" />
          <span>Sync 7D</span>
        </div>

        <span className="text-neutral-400 flex items-center gap-1 text-[10px] font-mono group-hover/flipping-card:text-cyan-300 transition-colors">
          <span>Pasa el cursor para ver análisis</span>
          <ArrowRight size={10} className="text-cyan-400 transition-transform group-hover/flipping-card:translate-x-0.5" />
        </span>
      </div>
    </div>
  );

  // 2. CARA TRASERA: Deep-Dives, Artículos Curados & Botón de Acción
  const backFace = (
    <div className="flex flex-col justify-between h-full w-full p-5 sm:p-6 select-none bg-transparent">
      <div className="flex flex-col gap-3">
        {/* Encabezado Cara Trasera: Título */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-800/80 pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Newspaper size={14} className="text-cyan-400 shrink-0" />
            <span className="text-xs font-mono uppercase font-bold text-white tracking-wider truncate">
              {entry.tool_name} // Deep-Dives & Análisis
            </span>
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/50 shrink-0">
            {entry.article_count_7d} artículo{entry.article_count_7d !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Lista de Artículos Curados */}
        {hasArticles ? (
          <div className="flex flex-col gap-2">
            {entry.top_articles_7d.slice(0, 2).map((art) => {
              const rawSummary =
                lang === 'es'
                  ? art.summary_es || art.summary_en
                  : art.summary_en || art.summary_es;
              const summary = cleanSummary(rawSummary);

              return (
                <div
                  key={art.article_id}
                  className="p-2.5 rounded-lg bg-neutral-900/70 border border-neutral-800/70 flex flex-col gap-1 hover:border-neutral-700 transition-colors"
                >
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-medium text-neutral-200 hover:text-cyan-300 transition-colors flex items-start justify-between gap-2"
                  >
                    <span className="line-clamp-2 leading-snug">{art.title}</span>
                    <ExternalLink
                      size={12}
                      className="shrink-0 mt-0.5 text-neutral-500 hover:text-cyan-400 transition-colors"
                    />
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
          <div className="p-4 rounded-lg bg-neutral-900/40 border border-neutral-800/60 text-xs font-mono text-neutral-400 flex flex-col gap-2">
            <span className="text-neutral-300 font-medium">Expediente de {entry.tool_name}:</span>
            <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
              Sin publicaciones externas esta semana. Consulta la arquitectura oficial y las notas de release para especificaciones de producción.
            </p>
          </div>
        )}
      </div>

      {/* Footer Cara Trasera: Navegación & Ver en Radar */}
      <div className="pt-3 mt-3 border-t border-neutral-800/70 flex items-center justify-between gap-3">
        <span className="text-[10px] font-mono text-neutral-500">
          Retira el cursor para volver ↺
        </span>

        <RevealButton
          onClick={handleOpenToolModal}
          size="sm"
          variant={hasBreaking ? 'rose' : 'emerald'}
          className="text-[11px] px-3 py-1.5"
        >
          Ver en Radar
        </RevealButton>
      </div>
    </div>
  );

  return (
    <FlippingCard
      height={390}
      width="100%"
      className={
        hasBreaking
          ? 'border-red-800/60 group-hover/flipping-card:border-red-600/80 group-hover/flipping-card:shadow-red-950/30'
          : isLead
          ? 'border-neutral-700/80 group-hover/flipping-card:border-emerald-500/60 group-hover/flipping-card:shadow-emerald-950/30'
          : 'border-neutral-800/80 group-hover/flipping-card:border-neutral-700 group-hover/flipping-card:shadow-cyan-950/20'
      }
      frontContent={frontFace}
      backContent={backFace}
    />
  );
}

// Vista Cronológica Tipo Feed / Log de Misión Control
function TimelineFeed({ entries, lang }: { entries: DigestEntry[]; lang: 'es' | 'en' }) {
  // Aplanar todos los eventos con fecha de publicación
  const timelineEvents = useMemo(() => {
    const events: Array<{
      id: string;
      tool_slug: string;
      tool_name: string;
      category: string;
      type: 'release' | 'article';
      title: string;
      badge?: string;
      hasBreaking?: boolean;
      url: string;
      dateStr: string;
      timestamp: number;
      summary?: string;
    }> = [];

    entries.forEach((entry) => {
      // Releases
      entry.releases_7d.forEach((rel, idx) => {
        const d = new Date(rel.published_at);
        events.push({
          id: `${entry.tool_slug}-rel-${rel.version}-${idx}`,
          tool_slug: entry.tool_slug,
          tool_name: entry.tool_name,
          category: entry.category,
          type: 'release',
          title: `Release ${rel.version}`,
          badge: rel.has_breaking ? 'BREAKING' : 'RELEASE',
          hasBreaking: rel.has_breaking,
          url: rel.source_url,
          dateStr: rel.published_at,
          timestamp: isNaN(d.getTime()) ? 0 : d.getTime(),
        });
      });

      // Artículos
      entry.top_articles_7d.forEach((art) => {
        const rawSummary =
          lang === 'es'
            ? art.summary_es || art.summary_en
            : art.summary_en || art.summary_es;
        events.push({
          id: `${entry.tool_slug}-art-${art.article_id}`,
          tool_slug: entry.tool_slug,
          tool_name: entry.tool_name,
          category: entry.category,
          type: 'article',
          title: art.title,
          badge: 'DEEP-DIVE',
          url: art.url,
          dateStr: 'esta semana',
          timestamp: 0,
          summary: cleanSummary(rawSummary),
        });
      });
    });

    // Ordenar cronológicamente (más recientes primero)
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, lang]);

  if (timelineEvents.length === 0) {
    return (
      <div className="w-full py-16 text-center rounded-2xl border border-neutral-800/80 bg-neutral-950/50 p-8">
        <Activity size={24} className="mx-auto text-neutral-600 mb-3" />
        <p className="text-neutral-400 text-sm font-mono">
          Sin eventos registrados en la línea de tiempo.
        </p>
      </div>
    );
  }

  return (
    <div className="relative border-l border-neutral-800/80 ml-3 sm:ml-6 pl-6 sm:pl-8 flex flex-col gap-6 py-2">
      {timelineEvents.map((evt) => (
        <motion.div
          key={evt.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: customEase }}
          className="relative group"
        >
          {/* Nodo en la línea de tiempo */}
          <div
            className={`absolute -left-[31px] sm:-left-[39px] top-3.5 size-3.5 rounded-full border-2 bg-black transition-colors ${
              evt.hasBreaking
                ? 'border-red-500 group-hover:bg-red-500'
                : evt.type === 'release'
                ? 'border-emerald-400 group-hover:bg-emerald-400'
                : 'border-cyan-400 group-hover:bg-cyan-400'
            }`}
          />

          {/* Tarjeta del Evento */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800/80 group-hover:border-neutral-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="size-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 p-1.5">
                <img
                  src={`/logos/${evt.tool_slug}.svg`}
                  alt={evt.tool_name}
                  className="size-5 object-contain"
                />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                  <span className="font-bold text-white">{evt.tool_name}</span>
                  <span className="text-neutral-600">·</span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                      evt.hasBreaking
                        ? 'bg-red-950/80 border border-red-800 text-red-300'
                        : evt.type === 'release'
                        ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                        : 'bg-cyan-950/60 border border-cyan-800/60 text-cyan-300'
                    }`}
                  >
                    {evt.badge}
                  </span>
                  {evt.dateStr && evt.dateStr !== 'esta semana' && (
                    <span className="text-neutral-500 text-[10px]">
                      {formatRelativeTime(evt.dateStr)}
                    </span>
                  )}
                </div>

                <a
                  href={evt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm font-medium text-neutral-200 hover:text-emerald-400 transition-colors line-clamp-1 inline-flex items-center gap-1.5"
                >
                  <span>{evt.title}</span>
                  <ExternalLink size={12} className="text-neutral-500 shrink-0" />
                </a>

                {evt.summary && (
                  <p className="mt-1 text-xs text-neutral-400 font-light line-clamp-2 leading-relaxed">
                    {evt.summary}
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <a
                href={evt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/80 text-xs font-mono text-neutral-300 transition-colors"
              >
                <span>Inspeccionar</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function DigestSection({ entries = [] }: { entries?: DigestEntry[] }) {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [activeFilter, setActiveFilter] = useState<'all' | 'breaking' | 'releases' | 'articles'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  const items = entries;

  // Sincronización con el selector de idioma global del Hero
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

  // Métricas agregadas para la cinta HUD interactiva
  const totalReleases7D = items.reduce((acc, curr) => acc + curr.release_count_7d, 0);
  const totalBreaking7D = items.reduce((acc, curr) => acc + curr.breaking_count_7d, 0);
  const totalArticles7D = items.reduce((acc, curr) => acc + curr.article_count_7d, 0);
  const activeEngines7D = items.filter((i) => i.release_count_7d + i.article_count_7d > 0).length;

  // Filtrado reactivo según el HUD seleccionado
  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case 'breaking':
        return items.filter((i) => i.breaking_count_7d > 0);
      case 'releases':
        return items.filter((i) => i.release_count_7d > 0);
      case 'articles':
        return items.filter((i) => i.article_count_7d > 0);
      case 'all':
      default:
        return items;
    }
  }, [items, activeFilter]);

  // Identificar el motor "Lead" (el que tenga breaking o mayor actividad)
  const leadSlug = useMemo(() => {
    if (filteredItems.length === 0) return null;
    const breakingItem = filteredItems.find((i) => i.breaking_count_7d > 0);
    if (breakingItem) return breakingItem.tool_slug;
    return filteredItems[0]?.tool_slug || null;
  }, [filteredItems]);

  return (
    <section
      id="digest"
      className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative scroll-mt-28"
    >
      {/* 1. Header con Eyebrow, Titular e Interruptor de Vista */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 sm:mb-10 border-b border-neutral-800/80 pb-6 sm:pb-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-400 w-fit">
            <Zap size={13} className="text-emerald-400" />
            <span>[04] // TELEMETRÍA SEMANAL · 7D PULSE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter text-white uppercase">
            Lo Que Pasó <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-500">
              Esta Semana.
            </span>
          </h2>

          <p className="text-neutral-400 text-sm md:text-base font-light leading-relaxed">
            Consolidado de eventos de los últimos 7 días en el stack de ingeniería de datos:
            versiones oficiales, alertas de incompatibilidad y publicaciones técnicas curadas.
          </p>
        </div>

        {/* Controles de Cabecera: Modo de Vista + Status Sincronizado */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-end">
          {/* Switcher de Vista: Bento por Motor vs Línea de Tiempo */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-xs select-none">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-neutral-800 text-white font-medium shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LayoutGrid size={13} className={viewMode === 'grid' ? 'text-emerald-400' : ''} />
              <span>Por Motor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-neutral-800 text-white font-medium shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ListTree size={13} className={viewMode === 'timeline' ? 'text-emerald-400' : ''} />
              <span>Línea de Tiempo</span>
            </button>
          </div>

          {/* Status LED de Sincronización (Fijo, sin animaciones estridentes) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs font-mono text-neutral-400">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span>Radar 7D: <strong className="text-white uppercase font-normal">Sincronizado</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Cinta de Métricas HUD Interactiva (Actúa como filtro en vivo) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        
        {/* HUD Card 1: Todos los Motores */}
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer relative ${
            activeFilter === 'all'
              ? 'bg-neutral-900/90 border-emerald-500/60 shadow-[0_0_20px_rgba(52,211,153,0.12)]'
              : 'bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/40'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>Motores Activos</span>
            <Activity size={14} className={activeFilter === 'all' ? 'text-emerald-400' : 'text-neutral-500'} />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
            {activeEngines7D}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {activeFilter === 'all' ? '● mostrando todos' : 'filtrar todos'}
          </span>
        </button>

        {/* HUD Card 2: Releases */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'releases' ? 'all' : 'releases')}
          className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer relative ${
            activeFilter === 'releases'
              ? 'bg-neutral-900/90 border-emerald-500/60 shadow-[0_0_20px_rgba(52,211,153,0.12)]'
              : 'bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/40'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>Releases (7D)</span>
            <GitCommitHorizontal size={14} className={activeFilter === 'releases' ? 'text-emerald-400' : 'text-neutral-500'} />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
            +{totalReleases7D}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {activeFilter === 'releases' ? '● filtro activo' : 'versiones publicadas'}
          </span>
        </button>

        {/* HUD Card 3: Breaking Changes */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'breaking' ? 'all' : 'breaking')}
          className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer relative ${
            activeFilter === 'breaking'
              ? 'bg-red-950/50 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              : totalBreaking7D > 0
              ? 'bg-red-950/20 border-red-900/60 hover:border-red-700/60'
              : 'bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={totalBreaking7D > 0 ? 'text-red-300 font-semibold' : 'text-neutral-400'}>
              Breaking Changes
            </span>
            {totalBreaking7D > 0 ? (
              <AlertTriangle size={14} className="text-red-400" />
            ) : (
              <ShieldCheck size={14} className="text-emerald-400" />
            )}
          </div>
          <span
            className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
              totalBreaking7D > 0 ? 'text-red-400' : 'text-white'
            }`}
          >
            {totalBreaking7D}
          </span>
          <span
            className={`text-[10px] font-mono ${
              totalBreaking7D > 0 ? 'text-red-400/90 font-medium' : 'text-emerald-400/80'
            }`}
          >
            {activeFilter === 'breaking'
              ? '● filtro activo'
              : totalBreaking7D > 0
              ? 'alertas detectadas'
              : 'ecosistema estable'}
          </span>
        </button>

        {/* HUD Card 4: Deep-Dives */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === 'articles' ? 'all' : 'articles')}
          className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer relative ${
            activeFilter === 'articles'
              ? 'bg-neutral-900/90 border-emerald-500/60 shadow-[0_0_20px_rgba(52,211,153,0.12)]'
              : 'bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/40'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>Deep-Dives (7D)</span>
            <Sparkles size={14} className={activeFilter === 'articles' ? 'text-cyan-400' : 'text-neutral-500'} />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">
            +{totalArticles7D}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {activeFilter === 'articles' ? '● filtro activo' : 'artículos técnicos'}
          </span>
        </button>

      </div>

      {/* Barra de Filtro Activo con botón de restablecer */}
      {activeFilter !== 'all' && (
        <div className="mb-6 flex items-center justify-between gap-3 p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs font-mono">
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span>
              Filtro activo: <strong className="text-white uppercase">{activeFilter}</strong> ({filteredItems.length} motores coincidentes)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer text-[11px]"
          >
            <RotateCcw size={12} />
            <span>Restablecer</span>
          </button>
        </div>
      )}

      {/* 3. Contenedor de Vista: Bento por Motor vs Timeline */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key={`grid-mode-${activeFilter}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {filteredItems.length === 0 ? (
              <div className="w-full py-16 text-center rounded-2xl border border-neutral-800/80 bg-neutral-950/50 p-8">
                <Activity size={24} className="mx-auto text-neutral-600 mb-3" />
                <p className="text-neutral-400 text-sm font-mono">
                  No hay motores que coincidan con el filtro seleccionado.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className="mt-3 text-xs font-mono text-emerald-400 hover:underline"
                >
                  Ver todos los motores
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 w-full">
                {filteredItems.map((entry) => (
                  <DigestCard
                    key={entry.tool_slug}
                    entry={entry}
                    lang={lang}
                    isLead={entry.tool_slug === leadSlug}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`timeline-mode-${activeFilter}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <TimelineFeed entries={filteredItems} lang={lang} />
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
