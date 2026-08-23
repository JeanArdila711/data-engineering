'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, MotionValue } from 'framer-motion';
import { 
  ArrowUpRight, 
  Command, 
  Database, 
  GitBranch, 
  Layers3, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Workflow, 
  Server, 
  Code2, 
  Zap, 
  Activity,
  X,
  AlertTriangle,
  ExternalLink,
  Plus,
  Copy,
  Check,
  Terminal as TerminalIcon
} from 'lucide-react';
import { ChangelogEntry } from '@/lib/db';

// Modal animation variants — deterministic, never race-conditions
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18, delay: 0.05 } },
};

const modalVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.7 },
  },
  exit: {
    opacity: 0, y: 24, scale: 0.97,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
  },
};

// Mobile bottom-sheet variant
const sheetVariants = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 380, damping: 36, mass: 0.8 },
  },
  exit: {
    opacity: 0, y: '100%',
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
  },
};

// Tool summaries based on official capabilities
const TOOL_SUMMARIES: Record<string, string> = {
  'airflow': 'Plataforma para crear, programar y monitorizar workflows y pipelines de datos complejos.',
  'apache-airflow': 'Plataforma para crear, programar y monitorizar workflows y pipelines de datos complejos.',
  'dagster': 'Orquestador orientado a activos de datos para pipelines reproducibles y altamente fiables.',
  'dbt-core': 'Transformaciones analíticas con ingeniería de software, testing automatizado y documentación viva.',
  'dbt': 'Transformaciones analíticas con ingeniería de software, testing automatizado y documentación viva.',
  'polars': 'Motor de procesamiento DataFrame en Rust, ultrarrápido, columnar y con soporte multi-hilo.',
  'spark': 'Motor unificado y distribuido para procesamiento de datos a gran escala y streaming.',
  'apache-spark': 'Motor unificado y distribuido para procesamiento de datos a gran escala y streaming.',
  'iceberg': 'Formato de tabla abierto para datasets analíticos enormes, transacciones ACID y evolución de esquema.',
  'apache-iceberg': 'Formato de tabla abierto para datasets analíticos enormes, transacciones ACID y evolución de esquema.',
  'duckdb': 'Base de datos analítica columnar embebida, ultrarrápida, ligera, cero dependencias y portable.',
  'trino': 'Motor SQL distribuido para consultas analíticas rápidas federadas sobre múltiples fuentes de datos.',
  'kafka': 'Plataforma distribuida de streaming de eventos y mensajería en tiempo real de alto rendimiento.',
  'apache-kafka': 'Plataforma distribuida de streaming de eventos y mensajería en tiempo real de alto rendimiento.',
  'flink': 'Framework y motor distribuido para procesamiento de streams con estado en tiempo real.',
  'apache-flink': 'Framework y motor distribuido para procesamiento de streams con estado en tiempo real.',
  'airbyte': 'Conecta fuentes y destinos con pipelines de ingesta y replicación ELT modulares.',
  'great-expectations': 'Expectativas declarativas para validar, perfilar y asegurar la calidad de tus datos.',
};

// Friendly Category Display Names
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'orchestration': 'Orquestación',
  'transformation': 'Transformación',
  'processing': 'Procesamiento',
  'dataframe': 'Dataframe',
  'table-format': 'Table Format / Lakehouse',
  'query-engine': 'Motor de Consulta',
  'streaming': 'Streaming',
  'ingestion': 'Ingesta & CDC',
  'quality': 'Calidad de Datos',
  'observability': 'Observabilidad',
};

// SemVer Badge Calculator (Major, Minor, Patch)
function getSemverBadge(version: string): { label: string; className: string } {
  const clean = version.replace(/^[vV]/, '').trim();
  const parts = clean.split('.');
  
  if (parts.length >= 3 && parts[1] === '0' && parts[2] === '0') {
    return { label: 'MAJOR', className: 'text-purple-400 border-purple-500/30 bg-purple-950/30' };
  }
  if (parts.length >= 2 && (parts[2] === '0' || parts[parts.length - 1] === '0')) {
    return { label: 'MINOR', className: 'text-blue-400 border-blue-500/30 bg-blue-950/30' };
  }
  return { label: 'PATCH', className: 'text-neutral-400 border-neutral-800 bg-neutral-900/60' };
}

// Tool icons mapping
function getToolIcon(slug: string, rawCategory: string) {
  const s = slug.toLowerCase();
  const c = rawCategory.toLowerCase();

  if (s.includes('airflow') || s.includes('dagster') || s.includes('prefect') || s.includes('mage') || c.includes('orchestration')) return GitBranch;
  if (s.includes('dbt') || c.includes('transformation')) return Layers3;
  if (s.includes('iceberg') || s.includes('delta') || s.includes('hudi') || c.includes('table-format')) return Database;
  if (s.includes('duckdb') || s.includes('trino') || c.includes('query-engine')) return Server;
  if (s.includes('spark') || s.includes('flink') || c.includes('processing')) return Sparkles;
  if (s.includes('polars') || c.includes('dataframe')) return Code2;
  if (s.includes('kafka') || c.includes('streaming')) return Zap;
  if (s.includes('airbyte') || s.includes('meltano') || c.includes('ingestion')) return ArrowUpRight;
  if (s.includes('expectations') || c.includes('quality') || c.includes('observability')) return ShieldCheck;
  
  return Activity;
}

// Format relative date in Spanish
function formatRelativeDate(dateInput: Date | string): string {
  try {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays <= 0) return 'hoy';
    if (diffInDays === 1) return 'hace 1 día';
    if (diffInDays < 7) return `hace ${diffInDays} días`;
    if (diffInDays < 14) return 'hace 1 semana';
    if (diffInDays < 30) return `hace ${Math.floor(diffInDays / 7)} semanas`;
    if (diffInDays < 60) return 'hace 1 mes';
    return `hace ${Math.floor(diffInDays / 30)} meses`;
  } catch {
    return 'reciente';
  }
}

// Category filter tabs definition with explicit mapping to DB values
const CATEGORY_FILTERS = [
  { label: 'Todas', keys: [] },
  { label: 'Orquestación', keys: ['orchestration'] },
  { label: 'Transformación & Procesamiento', keys: ['transformation', 'processing', 'dataframe'] },
  { label: 'Almacenamiento & Motores', keys: ['table-format', 'query-engine', 'lakehouse', 'storage', 'database'] },
  { label: 'Streaming & Ingesta', keys: ['streaming', 'ingestion', 'cdc'] },
  { label: 'Calidad & Observabilidad', keys: ['quality', 'observability'] },
];

interface ToolDisplay {
  id: string | number;
  name: string;
  slug: string;
  rawCategory: string;
  category: string;
  version: string;
  date: string;
  hasBreaking: boolean;
  breakingChanges: string[];
  summary: string;
  sourceUrl: string;
}

// Letter-by-letter Scroll Reveal Character
function ScrollRevealChar({ children, progress, range }: { children: React.ReactNode, progress: MotionValue<number>, range: number[] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const color = useTransform(progress, range, ["#262626", "#ffffff"]);
  
  return (
    <motion.span style={{ opacity, color }}>
      {children}
    </motion.span>
  );
}

// Scroll Reveal Title Component for Ecosystem Header
function EcosystemTitle({ text }: { text: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({
    target: titleRef,
    offset: ["start 90%", "end 45%"]
  });

  const { wordsWithIndices, totalChars } = useMemo(() => {
    const words = text.split(" ");
    let absoluteIndex = 0;
    const totalChars = text.replace(/\s/g, "").length;
    
    const wordsWithIndices = words.map(word => {
      return word.split("").map(char => {
        const index = absoluteIndex++;
        return { char, index };
      });
    });
    
    return { wordsWithIndices, totalChars };
  }, [text]);

  return (
    <h2 ref={titleRef} className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
      {wordsWithIndices.map((word, i) => (
        <span key={i} className="inline-block mr-[0.25em]">
          {word.map((letterInfo, j) => {
            const start = letterInfo.index / (totalChars * 1.5);
            const end = start + 0.3;
            return (
              <ScrollRevealChar key={j} progress={scrollYProgress} range={[start, end]}>
                {letterInfo.char}
              </ScrollRevealChar>
            );
          })}
        </span>
      ))}
    </h2>
  );
}

// Fullscreen & Mobile-Optimized Modal — deterministic, zero layoutId
function ExpandedToolModal({ 
  tool, 
  onClose 
}: { 
  tool: ToolDisplay; 
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const Icon = getToolIcon(tool.slug, tool.rawCategory);
  const semver = getSemverBadge(tool.version);

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  // Lock background scroll & ESC key
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const installCommand = `uv add ${tool.slug}==${tool.version.replace(/^v/, '')}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const panelVariants = isMobile ? sheetVariants : modalVariants;

  return (
    <>
      {/* Backdrop — completely separate from modal panel, no parent wrapper */}
      <motion.div
        key="backdrop"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md cursor-pointer"
      />

      {/* Modal Panel */}
      <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
        <motion.div
          key="modal-panel"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] bg-neutral-950 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
        >
          {/* Mobile Swipe Handle */}
          <div className="w-12 h-1.5 bg-neutral-700/80 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

          {/* Scrollable Content */}
          <div className="p-6 sm:p-8 overflow-y-auto flex flex-col gap-6">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="size-12 sm:size-14 rounded-2xl border border-neutral-800 bg-neutral-900 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                  <Icon size={24} strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                    {tool.name}
                  </h3>
                  <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider mt-0.5">
                    {tool.category}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="size-10 sm:size-11 rounded-full border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 active:scale-95 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Version & Status Banner */}
            <div className="p-4 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-light text-white">
                  {tool.version}
                </span>
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${semver.className}`}>
                  {semver.label}
                </span>
              </div>
              <span className="text-xs text-neutral-400 font-mono">{tool.date}</span>
            </div>

            {/* Breaking Changes */}
            {tool.hasBreaking ? (
              <div className="p-5 rounded-2xl border border-red-500/30 bg-red-950/20 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                  <AlertTriangle size={17} />
                  <span>Breaking Changes Detectados ({tool.breakingChanges?.length || 1})</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-neutral-300 leading-relaxed pl-1">
                  {tool.breakingChanges && tool.breakingChanges.length > 0 ? (
                    tool.breakingChanges.map((change, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-400 font-bold select-none">•</span>
                        <span>{change}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold select-none">•</span>
                      <span>Modificaciones en APIs o arquitecturas previas detectadas en el release. Se recomienda auditar el stack antes de actualizar en producción.</span>
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 flex items-center gap-3 text-emerald-400 text-xs sm:text-sm">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                <span>Release estable verificado sin breaking changes reportados. Actualización recomendada.</span>
              </div>
            )}

            {/* Installation Command */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <TerminalIcon size={12} />
                  <span>Comando de Instalación</span>
                </span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-emerald-400 hover:underline cursor-pointer"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <div className="p-3.5 rounded-xl border border-neutral-800 bg-black font-mono text-xs sm:text-sm text-neutral-300">
                <span className="text-emerald-400/90 select-all">{installCommand}</span>
              </div>
            </div>

            {/* Summary */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-wider">Propósito en el Ecosistema</h4>
              <p className="text-sm text-neutral-300 leading-relaxed font-light">
                {tool.summary}
              </p>
            </div>

            {/* CTA */}
            <div className="pt-4 border-t border-neutral-900 flex flex-col sm:flex-row gap-3 justify-end">
              <a
                href={tool.sourceUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 font-semibold py-3.5 px-6 rounded-xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <span>Ver Release Oficial en GitHub</span>
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function getToolRepoSlug(slug: string): string {
  const map: Record<string, string> = {
    'airflow': 'apache/airflow',
    'apache-airflow': 'apache/airflow',
    'dbt-core': 'dbt-labs/dbt-core',
    'dbt': 'dbt-labs/dbt-core',
    'iceberg': 'apache/iceberg',
    'apache-iceberg': 'apache/iceberg',
    'spark': 'apache/spark',
    'apache-spark': 'apache/spark',
    'polars': 'pola-rs/polars',
    'dagster': 'dagster-io/dagster',
    'duckdb': 'duckdb/duckdb',
    'trino': 'trinodb/trino',
    'kafka': 'apache/kafka',
    'apache-kafka': 'apache/kafka',
    'flink': 'apache/flink',
    'apache-flink': 'apache/flink',
    'airbyte': 'airbytehq/airbyte',
    'great-expectations': 'great-expectations/gx',
  };
  return map[slug.toLowerCase()] || `${slug}`;
}

// High-end Interactive Tool Card with Clean Morphing Transition & Hardware Polish
function ToolCard({ 
  tool, 
  onSelect 
}: { 
  tool: ToolDisplay; 
  onSelect: (tool: ToolDisplay) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = getToolIcon(tool.slug, tool.rawCategory);
  const semver = getSemverBadge(tool.version);

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(tool)}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-900/40 via-neutral-950/80 to-neutral-950/95 p-6 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] flex flex-col justify-between cursor-pointer border active:scale-[0.985] ${
        tool.hasBreaking 
          ? 'border-neutral-800/80 border-l-2 border-l-red-500/80 hover:border-neutral-700 hover:border-l-red-400 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]' 
          : 'border-neutral-800/80 hover:border-neutral-600 hover:shadow-[0_8px_30px_rgba(255,255,255,0.04)]'
      }`}
    >
      <div className="relative z-10 flex flex-col h-full">
        {/* Card Header: Icon + Name + Category + Interactive Plus Action */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-neutral-800/90 bg-neutral-900/90 text-neutral-300 group-hover:text-emerald-400 group-hover:border-neutral-700 transition-colors shadow-inner">
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="font-semibold text-base tracking-tight text-neutral-100 group-hover:text-white transition-colors">
                {tool.name}
              </h3>
              <p className="mt-0.5 font-mono text-[11px] text-neutral-500 tracking-wide uppercase">
                {tool.category}
              </p>
            </div>
          </div>
          
          {/* Action Plus Button that animates on hover */}
          <div className="size-8 rounded-full border border-neutral-800 bg-neutral-900/60 group-hover:bg-neutral-800 group-hover:border-neutral-700 flex items-center justify-center text-neutral-400 group-hover:text-white transition-all duration-300">
            <Plus 
              size={15} 
              className={`transition-transform duration-300 ${isHovered ? 'rotate-90 text-emerald-400' : ''}`} 
            />
          </div>
        </div>

        {/* Unified Telemetry Row: Version + SemVer Tag + Date (No dividing lines) */}
        <div className="mt-6 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-2xl md:text-3xl font-light tracking-tight text-white group-hover:text-neutral-100 transition-colors">
              {tool.version}
            </span>
            <span className={`font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded border ${semver.className}`}>
              {semver.label}
            </span>
          </div>
          <span className="text-xs font-light text-neutral-500 font-mono">
            {tool.date}
          </span>
        </div>

        {/* Status Alert Badge */}
        <div className="mt-3.5">
          {tool.hasBreaking ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 px-2.5 py-1 font-mono text-[10px] text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Breaking Changes Detectados
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-800/90 bg-neutral-900/60 px-2.5 py-1 font-mono text-[10px] text-neutral-400">
              <span className="size-1.5 rounded-full bg-emerald-400/90 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
              Release Estable
            </span>
          )}
        </div>

        {/* Clean Summary Description */}
        <p className="mt-4 text-sm leading-relaxed text-neutral-400 font-light line-clamp-2">
          {tool.summary}
        </p>

        {/* Technical High-Value Footer: Official Repo Slug + Expand Action */}
        <div className="mt-6 pt-4 border-t border-neutral-900/90 flex items-center justify-between">
          <span className="font-mono text-xs text-neutral-600 group-hover:text-neutral-400 transition-colors">
            {getToolRepoSlug(tool.slug)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-300 group-hover:text-white transition-colors">
            <span>Expandir</span>
            <ArrowUpRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-400" />
          </span>
        </div>
      </div>
    </article>
  );
}

export default function EcosystemSection({ entries = [] }: { entries?: ChangelogEntry[] }) {
  const [activeTab, setActiveTab] = useState(CATEGORY_FILTERS[0].label);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<ToolDisplay | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+K or Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format real database entries or provide standard tools if DB is empty
  const allTools: ToolDisplay[] = useMemo(() => {
    if (entries && entries.length > 0) {
      const toolMap = new Map<string, ToolDisplay>();
      
      for (const entry of entries) {
        if (!toolMap.has(entry.tool_slug)) {
          const rawCat = (entry.category || '').toLowerCase();
          const displayCat = CATEGORY_DISPLAY_NAMES[rawCat] || entry.category || 'General';
          
          toolMap.set(entry.tool_slug, {
            id: entry.release_id,
            name: entry.tool_name,
            slug: entry.tool_slug,
            rawCategory: rawCat,
            category: displayCat,
            version: entry.version,
            date: formatRelativeDate(entry.published_at),
            hasBreaking: entry.has_breaking,
            breakingChanges: entry.breaking_changes || [],
            summary: TOOL_SUMMARIES[entry.tool_slug] || `Última versión ${entry.version} disponible en el ecosistema.`,
            sourceUrl: entry.source_url,
          });
        }
      }
      return Array.from(toolMap.values());
    }

    // Default fallback tools
    return [
      { id: '1', name: 'Apache Airflow', slug: 'airflow', rawCategory: 'orchestration', category: 'Orquestación', version: 'v2.9.0', date: 'hace 2 días', hasBreaking: false, breakingChanges: [], summary: TOOL_SUMMARIES['airflow'], sourceUrl: 'https://github.com/apache/airflow/releases' },
      { id: '2', name: 'dbt Core', slug: 'dbt-core', rawCategory: 'transformation', category: 'Transformación', version: 'v1.8.4', date: 'hace 5 días', hasBreaking: true, breakingChanges: ['Eliminación de adapters deprecated para Postgres < 14', 'Cambio en el formato de schema.yml para semantic models'], summary: TOOL_SUMMARIES['dbt-core'], sourceUrl: 'https://github.com/dbt-labs/dbt-core/releases' },
      { id: '3', name: 'Apache Iceberg', slug: 'iceberg', rawCategory: 'table-format', category: 'Table Format / Lakehouse', version: 'v1.5.2', date: 'hace 1 semana', hasBreaking: false, breakingChanges: [], summary: TOOL_SUMMARIES['iceberg'], sourceUrl: 'https://github.com/apache/iceberg/releases' },
      { id: '4', name: 'Apache Spark', slug: 'spark', rawCategory: 'processing', category: 'Procesamiento', version: 'v3.5.1', date: 'hace 2 semanas', hasBreaking: false, breakingChanges: [], summary: TOOL_SUMMARIES['spark'], sourceUrl: 'https://github.com/apache/spark/releases' },
      { id: '5', name: 'Polars', slug: 'polars', rawCategory: 'dataframe', category: 'Dataframe', version: 'v0.20.15', date: 'hace 3 días', hasBreaking: false, breakingChanges: [], summary: TOOL_SUMMARIES['polars'], sourceUrl: 'https://github.com/pola-rs/polars/releases' },
      { id: '6', name: 'Dagster', slug: 'dagster', rawCategory: 'orchestration', category: 'Orquestación', version: 'v1.7.8', date: 'hace 6 días', hasBreaking: false, breakingChanges: [], summary: TOOL_SUMMARIES['dagster'], sourceUrl: 'https://github.com/dagster-io/dagster/releases' },
      { id: '7', name: 'DuckDB', slug: 'duckdb', rawCategory: 'query-engine', category: 'Motor de Consulta', version: 'v1.0.0', date: 'hace 1 día', hasBreaking: false, breakingChanges: [], summary: TOOL_SUMMARIES['duckdb'], sourceUrl: 'https://github.com/duckdb/duckdb/releases' },
      { id: '8', name: 'Trino', slug: 'trino', rawCategory: 'query-engine', category: 'Motor de Consulta', version: 'v440', date: 'hace 1 mes', hasBreaking: false, breakingChanges: [], summary: TOOL_SUMMARIES['trino'], sourceUrl: 'https://github.com/trinodb/trino/releases' },
    ];
  }, [entries]);

  // Filtering logic
  const filteredTools = useMemo(() => {
    const activeFilterDef = CATEGORY_FILTERS.find((f) => f.label === activeTab);
    const q = searchQuery.toLowerCase().trim();

    return allTools.filter((tool) => {
      let matchesCategory = true;
      if (activeFilterDef && activeFilterDef.keys.length > 0) {
        matchesCategory = activeFilterDef.keys.some((key) => {
          return (
            tool.rawCategory.toLowerCase().includes(key) ||
            tool.category.toLowerCase().includes(key)
          );
        });
      }

      let matchesQuery = true;
      if (q) {
        matchesQuery =
          tool.name.toLowerCase().includes(q) ||
          tool.category.toLowerCase().includes(q) ||
          tool.rawCategory.toLowerCase().includes(q) ||
          tool.version.toLowerCase().includes(q) ||
          tool.summary.toLowerCase().includes(q);
      }

      return matchesCategory && matchesQuery;
    });
  }, [allTools, activeTab, searchQuery]);

  return (
    <section id="ecosystem" className="w-full max-w-7xl mx-auto px-5 sm:px-6 py-16 sm:py-20 lg:py-28 relative">
      
      {/* Section Header */}
      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs tracking-widest text-emerald-400 font-semibold uppercase">
          [02] // ECOSYSTEM RADAR
        </p>

        <div className="mt-2 flex flex-col justify-between gap-6 sm:gap-8 lg:flex-row lg:items-end">
          <div>
            <EcosystemTitle text="Ecosistema & Herramientas" />
            <p className="mt-3 sm:mt-4 max-w-xl text-sm sm:text-base md:text-lg text-neutral-400 font-light leading-relaxed">
              Una mirada curada al stack moderno de datos. Versiones, cambios y señales para elegir con confianza.
            </p>
          </div>

          {/* Search Input Bar with Cmd+K */}
          <div className="relative w-full lg:max-w-xs">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar herramienta..."
              className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950/90 pl-10 pr-12 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-neutral-800 bg-neutral-900/80 px-2 py-0.5 font-mono text-[10px] text-neutral-500 flex items-center gap-0.5">
              <Command size={10} />
              <span>K</span>
            </kbd>
          </div>
        </div>
      </div>

      {/* Interactive Category Tabs with Sliding Indicator */}
      <div className="mt-8 sm:mt-10 overflow-x-auto pb-2 scrollbar-none border-b border-neutral-800/80 -mx-5 px-5 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1.5 sm:gap-2">
          {CATEGORY_FILTERS.map((tab) => {
            const isActive = activeTab === tab.label;
            
            const count = tab.keys.length === 0 
              ? allTools.length 
              : allTools.filter(t => tab.keys.some(k => t.rawCategory.toLowerCase().includes(k) || t.category.toLowerCase().includes(k))).length;

            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`relative px-3.5 sm:px-4 py-2.5 font-mono text-xs md:text-sm transition-colors rounded-lg ${
                  isActive ? 'text-white font-medium' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeCategory"
                    className="absolute inset-0 rounded-lg bg-neutral-900 border border-neutral-800 shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-neutral-800 text-emerald-400' : 'bg-neutral-900 text-neutral-600'}`}>
                    {count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="mt-8 min-h-[300px]">
        <AnimatePresence mode="wait">
          {filteredTools.length > 0 ? (
            <motion.div 
              key={activeTab + (searchQuery ? `-${searchQuery}` : '')}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
            >
              {filteredTools.map((tool) => (
                <ToolCard 
                  key={tool.slug} 
                  tool={tool} 
                  onSelect={(t) => setSelectedTool(t)} 
                />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="py-20 text-center flex flex-col items-center justify-center border border-dashed border-neutral-800/80 rounded-2xl bg-neutral-950/40"
            >
              <p className="text-neutral-400 font-mono text-sm">
                No se encontraron herramientas en la categoría seleccionada
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveTab('Todas'); }}
                className="mt-4 text-xs font-mono text-emerald-400 hover:underline cursor-pointer"
              >
                Restablecer todos los filtros
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Morphing Expandable Modal Dialog (Smooth Shared Layout) */}
      <AnimatePresence>
        {selectedTool && (
          <ExpandedToolModal 
            tool={selectedTool} 
            onClose={() => setSelectedTool(null)} 
          />
        )}
      </AnimatePresence>

    </section>
  );
}
