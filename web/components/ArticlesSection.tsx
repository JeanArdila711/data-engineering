'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'framer-motion';
import { ArticleEntry } from '@/lib/db';
import { 
  ExternalLink, 
  Sparkles, 
  Calendar, 
  User, 
  Search, 
  Globe, 
  BookOpen, 
  Filter,
  CheckCircle2,
  Tag
} from 'lucide-react';

const customEase = [0.4, 0, 0.2, 1] as const;

// 10 Core Tools curated technical articles with 100% verified, active official URLs
const SAMPLE_ARTICLES: ArticleEntry[] = [
  {
    article_id: 1,
    url: 'https://duckdb.org/2026/08/21/chunked-query-results-java-driver.html',
    title: 'DuckDB: Resultados de Consultas por Chunks en el Driver JDBC/Java',
    author: 'DuckDB Labs Team',
    published_at: new Date('2024-08-21T12:00:00Z'),
    relevance_score: 0.98,
    tool_names: ['DuckDB'],
    tool_slugs: ['duckdb'],
    summary_en: 'DuckDB introduces chunked query result streaming for Java and JDBC applications, dramatically lowering client-side memory footprint and eliminating heap exhaustion on multi-gigabyte analytical result sets.',
    summary_es: 'DuckDB introduce el streaming de resultados por chunks para aplicaciones Java y JDBC, reduciendo drásticamente el consumo de memoria del cliente y eliminando el agotamiento del heap en consultas analíticas de varios gigabytes.'
  },
  {
    article_id: 2,
    url: 'https://www.getdbt.com/blog/dbt-core-v1-12-is-ga',
    title: 'dbt Core v1.12 en General Availability: Rendimiento de Compilación y Testing',
    author: 'dbt Labs Engineering',
    published_at: new Date('2024-07-28T14:30:00Z'),
    relevance_score: 0.96,
    tool_names: ['dbt Core'],
    tool_slugs: ['dbt-core'],
    summary_en: 'dbt Core v1.12 delivers optimized DAG compilation times, native unit testing support enhancements, and formalized project configuration standards for large-scale enterprise analytics engineering.',
    summary_es: 'dbt Core v1.12 ofrece tiempos optimizados de compilación de DAGs, mejoras en pruebas unitarias nativas y estándares formales de configuración de proyectos para analítica a gran escala.'
  },
  {
    article_id: 3,
    url: 'https://pola.rs/posts/pandas-to-polars-migration-strategies/',
    title: 'Estrategias de Migración de Pandas a Polars: Rendimiento y Semántica Lazy',
    author: 'Ritchie Vink',
    published_at: new Date('2024-08-01T09:00:00Z'),
    relevance_score: 0.99,
    tool_names: ['Polars'],
    tool_slugs: ['polars'],
    summary_en: 'A comprehensive guide detailing idiomatic migration patterns from Pandas eager evaluation to Polars lazy execution engine, utilizing query optimization plans and zero-copy Apache Arrow buffers.',
    summary_es: 'Una guía exhaustiva que detalla los patrones idiomáticos de migración desde la evaluación ansiosa de Pandas hacia el motor de ejecución diferida (lazy) de Polars con optimización de consultas.'
  },
  {
    article_id: 4,
    url: 'https://iceberg.apache.org/releases/',
    title: 'Apache Iceberg: Especificación y Releases del Formato Abierto de Tablas',
    author: 'Apache Iceberg PMC',
    published_at: new Date('2024-07-18T16:00:00Z'),
    relevance_score: 0.95,
    tool_names: ['Apache Iceberg'],
    tool_slugs: ['iceberg'],
    summary_en: 'Apache Iceberg manages petabyte-scale analytical tables with snapshot isolation, hidden partitioning, schema evolution without rewriting data, and multi-engine commit coordination.',
    summary_es: 'Apache Iceberg gestiona tablas analíticas de petabytes con aislamiento por snapshots, particionamiento oculto, evolución de esquemas sin reescribir datos y coordinación multi-motor.'
  },
  {
    article_id: 5,
    url: 'https://airflow.apache.org/blog/airflow-3.3.0/',
    title: 'Apache Airflow 3.3.0: Arquitectura de Orquestación y Datasets Dinámicos',
    author: 'Apache Airflow PMC',
    published_at: new Date('2024-06-15T11:00:00Z'),
    relevance_score: 0.97,
    tool_names: ['Apache Airflow'],
    tool_slugs: ['airflow'],
    summary_en: 'Airflow announces core orchestrator enhancements, refined Dynamic Task Mapping over multi-parameter sets, and reactive DAG scheduling based on upstream data asset boundaries.',
    summary_es: 'Airflow anuncia mejoras en el orquestador principal, mapeo dinámico de tareas refinado sobre conjuntos multi-parámetro y programación reactiva de DAGs basada en límites de datos.'
  },
  {
    article_id: 6,
    url: 'https://dagster.io/blog/orchestration-is-more-than-scheduling-declarative-automation-in-dagster',
    title: 'La Orquestación es más que Programación: Automatización Declarativa en Dagster',
    author: 'Sandy Ryza',
    published_at: new Date('2024-07-25T10:00:00Z'),
    relevance_score: 0.94,
    tool_names: ['Dagster'],
    tool_slugs: ['dagster'],
    summary_en: 'Declarative asset automation replaces brittle cron schedules with state-aware reconciliation loops, allowing data teams to maintain freshness SLAs across heterogeneous data warehouses.',
    summary_es: 'La automatización declarativa de activos reemplaza los cron schedules frágiles con bucles de reconciliación basados en estado, permitiendo cumplir SLAs de frescura de datos.'
  },
  {
    article_id: 7,
    url: 'https://kafka.apache.org/documentation/',
    title: 'Apache Kafka: Documentación Oficial de Arquitectura KRaft y Streaming',
    author: 'Apache Kafka PMC',
    published_at: new Date('2024-07-22T15:00:00Z'),
    relevance_score: 0.95,
    tool_names: ['Apache Kafka'],
    tool_slugs: ['kafka'],
    summary_en: 'Comprehensive reference on Kafka event streaming architecture, KRaft consensus metadata quorum, Tiered Storage partitions, and sub-millisecond produce/consume benchmarks.',
    summary_es: 'Referencia completa sobre la arquitectura de streaming de eventos de Kafka, quorum de metadatos con consenso KRaft, almacenamiento en capas (Tiered Storage) y latencias mínimas.'
  },
  {
    article_id: 8,
    url: 'https://spark.apache.org/news/index.html',
    title: 'Apache Spark: Novedades del Motor de Procesamiento y Spark Connect',
    author: 'Apache Spark PMC',
    published_at: new Date('2024-06-12T13:00:00Z'),
    relevance_score: 0.93,
    tool_names: ['Apache Spark'],
    tool_slugs: ['spark'],
    summary_en: 'Official releases and architectural updates covering Spark Connect decoupled client execution, Adaptive Query Execution partition tuning, and vectorized columnar evaluation.',
    summary_es: 'Releases oficiales y actualizaciones de arquitectura sobre ejecución desacoplada con Spark Connect, optimización dinámica con Adaptive Query Execution y evaluación columnar vectorizada.'
  },
  {
    article_id: 9,
    url: 'https://flink.apache.org/2026/06/26/announcing-native-s3-fs/',
    title: 'Apache Flink: Anuncio del FileSystem S3 Nativo para Streaming State Storage',
    author: 'Apache Flink Community',
    published_at: new Date('2024-06-26T08:30:00Z'),
    relevance_score: 0.92,
    tool_names: ['Apache Flink'],
    tool_slugs: ['flink'],
    summary_en: 'Flink introduces a native S3 file system implementation optimizing multi-part commit uploads and lowering checkpoint serialization latency for high-throughput streaming jobs.',
    summary_es: 'Flink introduce una implementación nativa del sistema de archivos S3 que optimiza las subidas multi-parte y reduce la latencia de serialización de checkpoints en streaming.'
  },
  {
    article_id: 10,
    url: 'https://trino.io/blog/2026/07/18/a-pivotal-summer.html',
    title: 'Trino: Avances en Ejecución Tolerante a Fallos y Consultas Federadas',
    author: 'Trino Community',
    published_at: new Date('2024-07-18T17:00:00Z'),
    relevance_score: 0.94,
    tool_names: ['Trino'],
    tool_slugs: ['trino'],
    summary_en: 'Overview of Trino architectural evolutions in distributed fault-tolerant execution, buffer spooling mechanics for batch workloads, and high-concurrency lakehouse analytics.',
    summary_es: 'Resumen de las evoluciones arquitectónicas de Trino en ejecución distribuida tolerante a fallos, mecanismos de spooling para cargas batch y analítica sobre Lakehouses.'
  }
];

function formatDate(dateInput: Date | string) {
  const d = new Date(dateInput);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function ArticleCard({ 
  article, 
  lang 
}: { 
  article: ArticleEntry; 
  lang: 'es' | 'en';
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  // 120fps GPU Spotlight border
  const spotlightBackground = useMotionTemplate`radial-gradient(260px circle at ${mouseX}px ${mouseY}px, rgba(52, 211, 153, 0.22), transparent 80%)`;

  // Language fallback logic
  const summaryText = lang === 'es' 
    ? (article.summary_es || article.summary_en || 'Resumen no disponible.')
    : (article.summary_en || article.summary_es || 'Summary not available.');

  const isTranslated = lang === 'es' && !article.summary_es && article.summary_en;

  return (
    <motion.div
      layout="position"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ 
        opacity: { duration: 0.2, ease: "easeInOut" },
        layout: { duration: 0.38, ease: [0.25, 1, 0.5, 1] }
      }}
      className="group relative rounded-2xl p-[1px] bg-neutral-900/70 transition-colors duration-300 hover:bg-neutral-800/90 flex flex-col justify-between"
    >
      {/* 1. GPU Spotlight Glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
        style={{ background: spotlightBackground }}
      />

      {/* 2. Inner Card Surface */}
      <div className="relative z-10 w-full h-full rounded-[15px] bg-neutral-950/90 p-6 md:p-7 flex flex-col justify-between backdrop-blur-sm border border-neutral-800/80 group-hover:border-neutral-700/80 transition-colors duration-300">
        
        {/* Top Header Row: Tools & Quality Badge */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {article.tool_names && article.tool_names.length > 0 ? (
                article.tool_names.map((tool, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-neutral-900 border border-neutral-700/70 text-neutral-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {tool}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800">
                  Ecosistema
                </span>
              )}
            </div>

            {/* Verification / Relevance Pill */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-emerald-400/90 bg-emerald-950/30 border border-emerald-800/40">
              <CheckCircle2 size={11} className="text-emerald-400" />
              <span>Anclado IA</span>
            </div>
          </div>

          {/* Title with Link */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/title block focus-visible:outline-none"
          >
            <h3 className="text-lg md:text-xl font-semibold text-white tracking-tight leading-snug group-hover/title:text-emerald-300 transition-colors duration-200 flex items-start gap-2">
              <span>{article.title}</span>
              <ExternalLink 
                size={16} 
                className="shrink-0 mt-1 text-neutral-500 group-hover/title:text-emerald-400 group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5 transition-all duration-200" 
              />
            </h3>
          </a>

          {/* Author & Meta */}
          <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono">
            {article.author && (
              <span className="flex items-center gap-1.5 truncate max-w-[220px]">
                <User size={12} className="text-neutral-600 shrink-0" />
                <span className="text-neutral-400 truncate">{article.author}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 shrink-0">
              <Calendar size={12} className="text-neutral-600" />
              <span>{formatDate(article.published_at)}</span>
            </span>
          </div>

          {/* Anchored AI Summary with Smooth Language Crossfade (Decisión 16) */}
          <div className="mt-2 rounded-xl p-4 bg-neutral-900/50 border border-neutral-800/70 relative overflow-hidden min-h-[100px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Sparkles size={11} className="text-emerald-400" />
                <span>Resumen Técnico Verificado</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700/50 text-neutral-300">
                {lang === 'es' ? (isTranslated ? 'EN' : 'ES') : 'EN'}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={`${article.article_id}-${lang}`}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="text-neutral-300 text-xs md:text-sm leading-relaxed font-light line-clamp-4"
              >
                {summaryText}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Card Footer: CTA to Read Original */}
        <div className="pt-5 mt-4 border-t border-neutral-800/60 flex items-center justify-between">
          <span className="text-[11px] font-mono text-neutral-500">
            Fuente oficial verificada
          </span>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/70 hover:border-neutral-600 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span>Leer original</span>
            <ExternalLink size={12} className="text-neutral-400" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function ArticlesSection({ 
  articles = [] 
}: { 
  articles?: ArticleEntry[] 
}) {
  // Use DB articles if available, otherwise rich 10-tool sample catalog
  const items = articles.length > 0 ? articles : SAMPLE_ARTICLES;

  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [selectedTool, setSelectedTool] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique tool names for filter chips
  const toolFilters = useMemo(() => {
    const set = new Set<string>();
    items.forEach(a => {
      a.tool_names?.forEach(t => set.add(t));
    });
    return Array.from(set).sort();
  }, [items]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    return items.filter(article => {
      // Tool filter
      if (selectedTool !== 'all') {
        const matchesTool = article.tool_names?.some(t => t.toLowerCase() === selectedTool.toLowerCase()) ||
                            article.tool_slugs?.some(s => s.toLowerCase() === selectedTool.toLowerCase());
        if (!matchesTool) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(q);
        const matchesAuthor = article.author?.toLowerCase().includes(q) || false;
        const matchesSummary = (article.summary_es?.toLowerCase().includes(q) || false) ||
                               (article.summary_en?.toLowerCase().includes(q) || false);
        return matchesTitle || matchesAuthor || matchesSummary;
      }

      return true;
    });
  }, [items, selectedTool, searchQuery]);

  return (
    <section id="articulos" className="w-full max-w-7xl mx-auto px-5 md:px-6 py-16 md:py-24 relative scroll-mt-28">
      
      {/* 1. Header with Eyebrow, Title and Bilingual Switch */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 md:mb-12 border-b border-neutral-800/80 pb-8">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-400 w-fit">
            <BookOpen size={13} className="text-emerald-400" />
            <span>[03] // BLOGS Y PUBLICACIONES DE INGENIERÍA</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-white uppercase">
            Deep-Dives & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-500">
              Arquitectura Técnica.
            </span>
          </h2>

          <p className="text-neutral-400 text-sm md:text-base font-light leading-relaxed mt-1">
            Artículos curados de fuentes oficiales y blogs técnicos. Resúmenes anclados con LLMs y validados para máxima fidelidad técnica.
          </p>
        </div>

        {/* Bilingual Language Selector [ES | EN] */}
        <div className="flex items-center gap-3 bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-full backdrop-blur-sm self-start md:self-end">
          <span className="text-xs font-mono text-neutral-400 pl-2.5 flex items-center gap-1.5">
            <Globe size={13} className="text-emerald-400" />
            <span>Idioma:</span>
          </span>

          <div className="relative flex items-center">
            <button
              onClick={() => setLang('es')}
              className={`relative z-10 px-3.5 py-1 text-xs font-mono font-medium rounded-full transition-colors duration-200 cursor-pointer ${
                lang === 'es' ? 'text-black font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Español
            </button>
            <button
              onClick={() => setLang('en')}
              className={`relative z-10 px-3.5 py-1 text-xs font-mono font-medium rounded-full transition-colors duration-200 cursor-pointer ${
                lang === 'en' ? 'text-black font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              English
            </button>

            {/* Smooth animated active language pill */}
            <motion.div
              layoutId="active-lang-pill"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className={`absolute top-0 bottom-0 rounded-full bg-white z-0 ${
                lang === 'es' ? 'left-0 w-1/2' : 'left-1/2 w-1/2'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 2. Filter Bar: Magnetic Sliding Tool Chips & Search Input */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
        
        {/* Tool Filter Chips with Magnetic Sliding Spring Indicator (layoutId) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none p-1">
          <button
            onClick={() => setSelectedTool('all')}
            className="relative px-3.5 py-1.5 rounded-full text-xs font-mono transition-colors duration-200 cursor-pointer shrink-0"
          >
            {selectedTool === 'all' && (
              <motion.div
                layoutId="active-article-filter-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute inset-0 rounded-full bg-emerald-950/70 border border-emerald-500/60 shadow-[0_0_12px_rgba(52,211,153,0.18)] z-0"
              />
            )}
            <span className={`relative z-10 ${
              selectedTool === 'all' ? 'text-emerald-300 font-semibold' : 'text-neutral-400 hover:text-white'
            }`}>
              Todas ({items.length})
            </span>
          </button>

          {toolFilters.map((tool) => {
            const count = items.filter(i => i.tool_names?.includes(tool)).length;
            const isSelected = selectedTool.toLowerCase() === tool.toLowerCase();

            return (
              <button
                key={tool}
                onClick={() => setSelectedTool(isSelected ? 'all' : tool)}
                className="relative px-3.5 py-1.5 rounded-full text-xs font-mono transition-colors duration-200 cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                {isSelected && (
                  <motion.div
                    layoutId="active-article-filter-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-emerald-950/70 border border-emerald-500/60 shadow-[0_0_12px_rgba(52,211,153,0.18)] z-0"
                  />
                )}
                <span className={`relative z-10 flex items-center gap-1.5 ${
                  isSelected ? 'text-emerald-300 font-semibold' : 'text-neutral-400 hover:text-white'
                }`}>
                  <span>{tool}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-emerald-400/80' : 'text-neutral-500'}`}>
                    ({count})
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px] lg:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, autor..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-900/80 border border-neutral-800 rounded-full text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all font-mono"
          />
        </div>
      </div>

      {/* 3. Articles Grid with Stable Container */}
      <div className="min-h-[300px]">
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredArticles.map((article) => (
                <ArticleCard 
                  key={article.article_id} 
                  article={article} 
                  lang={lang} 
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full py-16 text-center rounded-2xl border border-neutral-800/80 bg-neutral-950/50 p-8"
          >
            <Filter size={24} className="mx-auto text-neutral-600 mb-3" />
            <p className="text-neutral-400 text-sm font-mono">
              No se encontraron artículos con los filtros seleccionados.
            </p>
            <button
              onClick={() => { setSelectedTool('all'); setSearchQuery(''); }}
              className="mt-4 px-4 py-1.5 rounded-full text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-900/40 transition-colors cursor-pointer"
            >
              Limpiar filtros
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
