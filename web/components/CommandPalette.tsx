'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Command,
  ArrowRight,
  ExternalLink,
  Layers,
  FileText,
  Compass,
  Zap,
  Check,
  AlertTriangle,
  Radio,
  CornerDownLeft,
} from 'lucide-react';
import { ChangelogEntry, ArticleEntry } from '@/lib/db';
import { useToast } from '@/components/ui/toast';

interface CommandPaletteProps {
  entries?: ChangelogEntry[];
  articles?: ArticleEntry[];
}

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'HERRAMIENTAS' | 'ARTÍCULOS' | 'SECCIONES' | 'ACCIONES';
  icon: React.ElementType;
  badge?: string;
  badgeType?: 'default' | 'breaking' | 'emerald';
  action: () => void;
}

const customEase = [0.16, 1, 0.3, 1] as const;

export default function CommandPalette({ entries = [], articles = [] }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Global Keyboard Listener for ⌘K / Ctrl+K and custom open event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    const handleOpenEvent = () => {
      setOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenEvent);
    };
  }, [open]);

  // Focus input on open and lock body scroll
  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = 'hidden';
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      document.documentElement.style.overflow = '';
    }
  }, [open]);

  const toolsList = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; category: string; version: string; hasBreaking: boolean }>();
    for (const e of entries) {
      if (!map.has(e.tool_slug)) {
        map.set(e.tool_slug, {
          name: e.tool_name,
          slug: e.tool_slug,
          category: e.category || 'General',
          version: e.version,
          hasBreaking: e.has_breaking,
        });
      }
    }
    return Array.from(map.values());
  }, [entries]);

  const scrollToSection = (id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const navbarHeight = 80;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = Math.max(0, elementPosition - navbarHeight);
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const openToolModal = (slug: string) => {
    setOpen(false);
    scrollToSection('ecosystem');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-tool-modal', { detail: { slug } }));
    }, 450);
  };

  // Build items catalogue
  const allItems: PaletteItem[] = useMemo(() => {
    const list: PaletteItem[] = [];

    // 1. Herramientas
    toolsList.forEach((t) => {
      list.push({
        id: `tool-${t.slug}`,
        title: t.name,
        subtitle: `${t.category} • ${t.version}`,
        category: 'HERRAMIENTAS',
        icon: Layers,
        badge: t.hasBreaking ? 'BREAKING' : t.version,
        badgeType: t.hasBreaking ? 'breaking' : 'emerald',
        action: () => openToolModal(t.slug),
      });
    });

    // 2. Artículos & Deep-Dives
    articles.slice(0, 10).forEach((art) => {
      const primaryTool = art.tool_names && art.tool_names.length > 0 ? art.tool_names[0] : null;
      list.push({
        id: `art-${art.article_id}`,
        title: art.title,
        subtitle: primaryTool ? `Ecosistema ${primaryTool}` : 'Deep-Dive Técnico',
        category: 'ARTÍCULOS',
        icon: FileText,
        badge: primaryTool || 'Blog',
        badgeType: 'default',
        action: () => {
          setOpen(false);
          if (art.url) {
            window.open(art.url, '_blank', 'noopener,noreferrer');
          } else {
            scrollToSection('articulos');
          }
        },
      });
    });

    // 3. Secciones
    const sections = [
      { label: 'Radar de Datos & Terminal Interactiva', id: 'radar', sub: 'Hero principal y métricas en vivo' },
      { label: 'Manifiesto de Ingeniería', id: 'manifiesto', sub: 'Propósito técnico y Git Diff' },
      { label: 'Ecosistema & Directorio de Herramientas', id: 'ecosystem', sub: 'Releases, filtros por categoría y hardware specs' },
      { label: 'Artículos & Deep-Dives Curados', id: 'articulos', sub: 'Análisis técnicos y switch bilingüe ES/EN' },
      { label: 'Digest Semanal de Actividad', id: 'digest', sub: 'Resumen consolidado de los últimos 7 días' },
    ];

    sections.forEach((sec) => {
      list.push({
        id: `sec-${sec.id}`,
        title: sec.label,
        subtitle: sec.sub,
        category: 'SECCIONES',
        icon: Compass,
        action: () => scrollToSection(sec.id),
      });
    });

    // 4. Acciones Rápidas
    list.push({
      id: 'act-copy-link',
      title: 'Copiar enlace al portapapeles',
      subtitle: 'Comparte DE Radar con tu equipo de datos',
      category: 'ACCIONES',
      icon: Zap,
      action: () => {
        setOpen(false);
        navigator.clipboard.writeText(window.location.href);
        showToast('Enlace de DE Radar copiado al portapapeles');
      },
    });

    list.push({
      id: 'act-github',
      title: 'Abrir Repositorio de GitHub',
      subtitle: 'JeanArdila711/data-engineering',
      category: 'ACCIONES',
      icon: ExternalLink,
      badge: 'Open Source',
      badgeType: 'default',
      action: () => {
        setOpen(false);
        window.open('https://github.com/JeanArdila711/data-engineering', '_blank', 'noopener,noreferrer');
      },
    });

    list.push({
      id: 'act-top',
      title: 'Volver al inicio de la página',
      subtitle: 'Scroll suave hacia arriba',
      category: 'ACCIONES',
      icon: Compass,
      action: () => {
        setOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });

    return list;
  }, [toolsList, articles]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allItems;

    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  // Group filtered items by category
  const groupedCategories = useMemo(() => {
    const categories: { name: string; items: PaletteItem[] }[] = [];
    const order: PaletteItem['category'][] = ['HERRAMIENTAS', 'SECCIONES', 'ARTÍCULOS', 'ACCIONES'];

    order.forEach((cat) => {
      const items = filteredItems.filter((i) => i.category === cat);
      if (items.length > 0) {
        categories.push({ name: cat, items });
      }
    });

    return categories;
  }, [filteredItems]);

  // Flattened array for keyboard index mapping
  const flatItems = useMemo(() => {
    return groupedCategories.flatMap((g) => g.items);
  }, [groupedCategories]);

  // Reset or clamp selectedIndex when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flatItems[selectedIndex];
      if (current) {
        current.action();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!mounted) return null;

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-16 sm:pt-24 px-4 select-none">
              {/* Dark Translucent Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />

              {/* Command Palette Window */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ duration: 0.25, ease: customEase }}
                className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950/95 shadow-[0_24px_70px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl flex flex-col overflow-hidden text-neutral-200"
              >
                {/* Search Input Bar */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-800/80">
                  <Search size={18} className="text-emerald-400 shrink-0 animate-pulse" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Buscar herramientas, artículos, secciones o acciones..."
                    className="w-full bg-transparent text-sm sm:text-base font-sans text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="text-xs font-mono text-neutral-500 hover:text-white px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                    >
                      ESC
                    </button>
                  )}
                </div>

                {/* Results List */}
                <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-neutral-800">
                  {flatItems.length === 0 ? (
                    <div className="py-12 text-center text-neutral-500 text-sm font-mono flex flex-col items-center gap-2">
                      <Search size={24} className="text-neutral-700 mb-1" />
                      <p>No se encontraron resultados para &ldquo;<span className="text-neutral-300">{query}</span>&rdquo;</p>
                      <p className="text-xs text-neutral-600">Prueba buscando por &quot;DuckDB&quot;, &quot;Airflow&quot;, &quot;Manifiesto&quot; o &quot;Digest&quot;</p>
                    </div>
                  ) : (
                    groupedCategories.map((group) => (
                      <div key={group.name} className="mb-3 last:mb-1">
                        {/* Category Header */}
                        <div className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase flex items-center justify-between">
                          <span>{group.name}</span>
                          <span className="text-[9px] bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-800/60 text-neutral-600">
                            {group.items.length}
                          </span>
                        </div>

                        {/* Category Items */}
                        <div className="flex flex-col gap-0.5 mt-1">
                          {group.items.map((item) => {
                            const globalIdx = flatItems.findIndex((fi) => fi.id === item.id);
                            const isSelected = globalIdx === selectedIndex;
                            const IconComponent = item.icon;

                            return (
                              <div
                                key={item.id}
                                data-selected={isSelected}
                                onClick={item.action}
                                onMouseEnter={() => setSelectedIndex(globalIdx)}
                                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 relative ${
                                  isSelected
                                    ? 'bg-neutral-900 text-white shadow-sm border border-neutral-800/80'
                                    : 'text-neutral-300 hover:bg-neutral-900/40 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                  <div
                                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                                      isSelected
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 group-hover:text-neutral-200'
                                    }`}
                                  >
                                    <IconComponent size={15} />
                                  </div>

                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs sm:text-sm font-medium tracking-tight truncate flex items-center gap-2">
                                      <span>{item.title}</span>
                                    </span>
                                    {item.subtitle && (
                                      <span className="text-[11px] font-mono text-neutral-500 truncate">
                                        {item.subtitle}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {item.badge && (
                                    <span
                                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border tracking-wider uppercase font-semibold ${
                                        item.badgeType === 'breaking'
                                          ? 'bg-red-950/60 border-red-800/60 text-red-400'
                                          : item.badgeType === 'emerald'
                                          ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                                      }`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}

                                  {isSelected && (
                                    <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-neutral-950 border border-emerald-500/30 px-1.5 py-0.5 rounded shadow-sm">
                                      <span>Ir</span>
                                      <CornerDownLeft size={10} />
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Telemetry & Shortcuts Bar */}
                <div className="px-4 py-2.5 border-t border-neutral-800/80 bg-neutral-950/80 text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400">↑↓</kbd>
                      <span>Navegar</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400">↵</kbd>
                      <span>Seleccionar</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400">ESC</kbd>
                      <span>Cerrar</span>
                    </span>
                  </div>

                  <span className="hidden sm:flex items-center gap-1.5 text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>DE RADAR COMMAND</span>
                  </span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
