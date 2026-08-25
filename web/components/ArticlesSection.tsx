'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, useInView } from 'framer-motion';
import { ArticleEntry } from '@/lib/db';
import {
  CardCurtainReveal,
  CardCurtainRevealBody,
  CardCurtainRevealDescription,
  CardCurtainRevealFooter,
  CardCurtainRevealTitle,
  CardCurtain 
} from "@/components/ui/card-curtain-reveal"
import { Button } from "@/components/ui/button"
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
  Quote,
  ChevronLeft,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';

const customEase = [0.4, 0, 0.2, 1] as const;
const smoothEase = [0.16, 1, 0.3, 1] as const;

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
  const [isMobile, setIsMobile] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { margin: "-20% 0px -20% 0px" });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    checkMobile(); // Check on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isOpen = isMobile ? isInView : undefined;

  const rawSummary = lang === 'es' 
    ? (article.summary_es || article.summary_en)
    : (article.summary_en || article.summary_es);

  const fallbackText = lang === 'es'
    ? `Explora la documentación técnica, guías de arquitectura y notas de versión detalladas sobre ${article.tool_names?.[0] || 'esta herramienta'} en la publicación oficial.`
    : `Explore technical documentation, architecture guides, and detailed release notes for ${article.tool_names?.[0] || 'this tool'} in the official publication.`;

  const summaryText = rawSummary ? cleanSummary(rawSummary) : fallbackText;
  const heroSlug = article.tool_slugs?.[0]; // Pick first tool for the footer logo

  return (
    <CardCurtainReveal 
      ref={cardRef}
      forceOpen={isOpen}
      className="h-[420px] md:h-[480px] w-full border border-neutral-800 bg-neutral-950 text-neutral-50 shadow-xl rounded-2xl cursor-default transition-colors hover:border-neutral-700"
    >
      <CardCurtainRevealBody className="relative z-20 flex flex-col p-6 md:p-8 h-full">
        
        {/* Minimal Tool Tag & Meta (Top) */}
        <div className="flex items-center justify-between gap-4 mb-auto opacity-70">
          <div className="flex items-center gap-2">
            {heroSlug && (
              <img 
                src={`/logos/${heroSlug}.svg`} 
                className="size-4 opacity-80" 
                onError={(e) => e.currentTarget.style.display='none'} 
                alt="Logo"
              />
            )}
            <span className="text-[11px] font-mono tracking-wider text-neutral-400">
              {article.tool_names && article.tool_names.length > 0 
                ? article.tool_names[0].toUpperCase()
                : 'ECOSISTEMA'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[10px] font-mono text-neutral-500">
            {article.relevance_score > 85 && (
              <Sparkles size={11} className="text-emerald-500/80" />
            )}
            {article.author && <span className="truncate max-w-[100px]">{article.author}</span>}
            <span className="tabular-nums">{formatDate(article.published_at)}</span>
          </div>
        </div>

        {/* Massive Animated Title */}
        <CardCurtainRevealTitle className="text-2xl md:text-3xl font-medium tracking-tight text-balance leading-snug">
          {article.title}
        </CardCurtainRevealTitle>

        {/* Summary Description */}
        <CardCurtainRevealDescription className="my-6 text-neutral-400 text-sm md:text-[15px] leading-relaxed line-clamp-4">
          <p>{summaryText}</p>
        </CardCurtainRevealDescription>

        {/* CTA Button */}
        <a 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-auto block w-max focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full"
        >
          <Button
            variant="secondary"
            size="icon"
            className="aspect-square rounded-full bg-neutral-100 text-neutral-950 hover:bg-white"
          >
            <ArrowUpRight className="size-4" />
          </Button>
        </a>

        {/* The Curtain Background (Mix-blend Difference inversion) */}
        <CardCurtain className="bg-neutral-100" />
      </CardCurtainRevealBody>

      {/* Footer Logo Reveal (Mesh Gradient Effect) */}
      <CardCurtainRevealFooter className="absolute bottom-0 right-0 w-full h-1/2 pointer-events-none flex items-end justify-end p-8 overflow-hidden z-10">
        {heroSlug && (
          <img 
            alt="Hero Logo"
            src={`/logos/${heroSlug}.svg`} 
            className="w-56 h-56 opacity-40 blur-[40px] translate-x-12 translate-y-12"
          />
        )}
      </CardCurtainRevealFooter>
    </CardCurtainReveal>
  );
}

export default function ArticlesSection({ 
  articles = [] 
}: { 
  articles?: ArticleEntry[] 
}) {
  const items = articles;

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

  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState(0);
  const ITEMS_PER_PAGE = 4;

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

  // Reset page to 1 when filters or search query change
  useEffect(() => {
    setCurrentPage(1);
    setDirection(0);
  }, [selectedTool, searchQuery]);

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

  // Paginated articles slice
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setDirection(newPage > currentPage ? 1 : -1);
    setCurrentPage(newPage);
  };

  // Direction-Aware Motion Variants (agent-13 & agent-15)
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
        ease: smoothEase,
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -36 : dir < 0 ? 36 : 0,
      opacity: 0,
      filter: 'blur(3px)',
      scale: 0.99,
      transition: {
        duration: 0.2,
        ease: customEase,
      },
    }),
  };

  return (
    <section id="articulos" className="w-full max-w-7xl mx-auto px-5 md:px-6 py-16 md:py-24 relative scroll-mt-28">
      
      {/* 1. Header with Eyebrow and Title */}
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

        {/* Language Indicator Badge (Synchronized with Hero) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs font-mono text-neutral-400 self-start md:self-end">
          <Globe size={13} className="text-emerald-400" />
          <span>Resúmenes en: <strong className="text-white uppercase">{lang}</strong></span>
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

      {/* 3. Articles Grid with Layout Spring Stability (Fluid 4 to 2 items transition) */}
      <motion.div 
        layout="position"
        transition={{ duration: 0.35, ease: smoothEase }}
        className="relative overflow-hidden w-full min-h-[320px]"
      >
        {filteredArticles.length > 0 ? (
          <>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={`page-${currentPage}-${selectedTool}-${searchQuery}`}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 w-full group/grid"
              >
                {paginatedArticles.map((article) => (
                  <ArticleCard 
                    key={article.article_id} 
                    article={article} 
                    lang={lang} 
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* 4. High-End Interactive Pagination Bar with Layout Animation */}
            {totalPages > 1 && (
              <motion.div 
                layout
                transition={{ duration: 0.35, ease: smoothEase }}
                className="mt-10 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                {/* Telemetry Counter */}
                <div className="text-xs font-mono text-neutral-500 flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Mostrando <strong className="text-neutral-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> - <strong className="text-neutral-200">{Math.min(currentPage * ITEMS_PER_PAGE, filteredArticles.length)}</strong> de <strong className="text-neutral-200">{filteredArticles.length}</strong> deep-dives
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
                  <div className="flex items-center gap-0.5 sm:gap-1 px-1">
                    {(() => {
                      const getVisiblePages = () => {
                        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
                        if (currentPage <= 3) return [1, 2, 3, 4, "...", totalPages];
                        if (currentPage >= totalPages - 2) return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                        return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
                      };

                      return getVisiblePages().map((pageNum, idx) => {
                        if (pageNum === "...") {
                          return (
                            <div key={`ellipsis-${idx}`} className="w-6 sm:w-8 flex justify-center items-center text-neutral-500 font-serif">
                              &hellip;
                            </div>
                          );
                        }

                        const isCurrent = currentPage === pageNum;

                        return (
                          <motion.button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum as number)}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            aria-label={`Ir a página ${pageNum}`}
                            className={`relative size-7 sm:size-8 rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-colors cursor-pointer ${
                              isCurrent
                                ? 'text-emerald-300 font-bold'
                                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
                            }`}
                          >
                            {isCurrent && (
                              <motion.div
                                layoutId="active-article-page-pill"
                                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                                className="absolute inset-0 rounded-lg bg-emerald-950/80 border border-emerald-500/60 shadow-[0_0_14px_rgba(52,211,153,0.22)] z-0"
                              />
                            )}
                            <span className="relative z-10">{pageNum}</span>
                          </motion.button>
                        );
                      });
                    })()}
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
              {items.length === 0
                ? 'Aún no hay artículos ingeridos en la base de datos.'
                : 'No se encontraron artículos con los filtros seleccionados.'}
            </p>
            {items.length > 0 && (
              <button
                onClick={() => { setSelectedTool('all'); setSearchQuery(''); }}
                className="mt-4 px-4 py-1.5 rounded-full text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-900/40 transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
