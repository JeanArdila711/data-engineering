'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useMotionTemplate, MotionValue } from 'framer-motion';
import { 
  ArrowUpRight, 
  Command, 
  Database, 
  GitBranch, 
  Layers3, 
  Search, 
  ShieldCheck, 
  Sparkles, 
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
  BookOpen,
  Cpu,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Terminal as TerminalIcon
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { ChangelogEntry } from '@/lib/db';

// Technical hardware & runtime specifications per tool
const TOOL_METADATA: Record<string, { repo: string; license: string; runtime: string; layer: string }> = {
  'airflow': { repo: 'apache/airflow', license: 'Apache-2.0', runtime: 'Python >=3.8, <3.13', layer: 'Orquestación de Pipelines' },
  'apache-airflow': { repo: 'apache/airflow', license: 'Apache-2.0', runtime: 'Python >=3.8, <3.13', layer: 'Orquestación de Pipelines' },
  'dbt-core': { repo: 'dbt-labs/dbt-core', license: 'Apache-2.0', runtime: 'Python >=3.9, <=3.12', layer: 'Transformación & Semántica' },
  'dbt': { repo: 'dbt-labs/dbt-core', license: 'Apache-2.0', runtime: 'Python >=3.9, <=3.12', layer: 'Transformación & Semántica' },
  'duckdb': { repo: 'duckdb/duckdb', license: 'MIT License', runtime: 'C++20 / In-Process / WASM', layer: 'Motor Analítico Embebido' },
  'polars': { repo: 'pola-rs/polars', license: 'MIT License', runtime: 'Rust SIMD / Apache Arrow', layer: 'DataFrames de Alto Rendimiento' },
  'iceberg': { repo: 'apache/iceberg', license: 'Apache-2.0', runtime: 'Java / Python / Rust', layer: 'Open Table Format / Lakehouse' },
  'apache-iceberg': { repo: 'apache/iceberg', license: 'Apache-2.0', runtime: 'Java / Python / Rust', layer: 'Open Table Format / Lakehouse' },
  'spark': { repo: 'apache/spark', license: 'Apache-2.0', runtime: 'Scala / JVM / Spark Connect', layer: 'Procesamiento Distribuido' },
  'apache-spark': { repo: 'apache/spark', license: 'Apache-2.0', runtime: 'Scala / JVM / Spark Connect', layer: 'Procesamiento Distribuido' },
  'dagster': { repo: 'dagster-io/dagster', license: 'Apache-2.0', runtime: 'Python >=3.9, <=3.12', layer: 'Orquestación Basada en Assets' },
  'kafka': { repo: 'apache/kafka', license: 'Apache-2.0', runtime: 'Java 17+ / KRaft Quorum', layer: 'Event Streaming Distribuido' },
  'apache-kafka': { repo: 'apache/kafka', license: 'Apache-2.0', runtime: 'Java 17+ / KRaft Quorum', layer: 'Event Streaming Distribuido' },
  'flink': { repo: 'apache/flink', license: 'Apache-2.0', runtime: 'Java 11+ / Stateful Streams', layer: 'Streaming en Tiempo Real' },
  'apache-flink': { repo: 'apache/flink', license: 'Apache-2.0', runtime: 'Java 11+ / Stateful Streams', layer: 'Streaming en Tiempo Real' },
  'trino': { repo: 'trinodb/trino', license: 'Apache-2.0', runtime: 'Java 21+ / Distributed MPP', layer: 'Motor de Consulta Federado' },
};

// Verified deep-dives & technical articles per tool
const TOOL_ARTICLES: Record<string, { title: string; url: string; author: string; summary: string }> = {
  'dbt-core': {
    title: 'dbt Core v1.12 en General Availability: Rendimiento de Compilación y Testing',
    url: 'https://www.getdbt.com/blog/dbt-core-v1-12-is-ga',
    author: 'dbt Labs Team',
    summary: 'Testing unitario nativo y optimización de compilación de DAGs para proyectos a gran escala.',
  },
  'dbt': {
    title: 'dbt Core v1.12 en General Availability: Rendimiento de Compilación y Testing',
    url: 'https://www.getdbt.com/blog/dbt-core-v1-12-is-ga',
    author: 'dbt Labs Team',
    summary: 'Testing unitario nativo y optimización de compilación de DAGs para proyectos a gran escala.',
  },
  'duckdb': {
    title: 'DuckDB: Resultados de Consultas por Chunks en el Driver JDBC/Java',
    url: 'https://duckdb.org/2026/08/21/chunked-query-results-java-driver.html',
    author: 'DuckDB Labs Team',
    summary: 'Streaming de resultados por chunks para aplicaciones Java, reduciendo el consumo de memoria RAM.',
  },
  'polars': {
    title: 'Estrategias de Migración de Pandas a Polars: Rendimiento y Semántica Lazy',
    url: 'https://pola.rs/posts/pandas-to-polars-migration-strategies/',
    author: 'Ritchie Vink',
    summary: 'Patrones idiomáticos de migración hacia el motor lazy de Polars con optimización de consultas en Rust.',
  },
  'iceberg': {
    title: 'Apache Iceberg: Especificación y Releases del Formato Abierto de Tablas',
    url: 'https://iceberg.apache.org/releases/',
    author: 'Apache Iceberg PMC',
    summary: 'Tablas analíticas de petabytes con snapshot isolation, particionamiento oculto y commits atómicos.',
  },
  'apache-iceberg': {
    title: 'Apache Iceberg: Especificación y Releases del Formato Abierto de Tablas',
    url: 'https://iceberg.apache.org/releases/',
    author: 'Apache Iceberg PMC',
    summary: 'Tablas analíticas de petabytes con snapshot isolation, particionamiento oculto y commits atómicos.',
  },
  'airflow': {
    title: 'Apache Airflow 3.3.0: Arquitectura de Orquestación y Datasets Dinámicos',
    url: 'https://airflow.apache.org/blog/airflow-3.3.0/',
    author: 'Apache Airflow PMC',
    summary: 'Mapeo dinámico de tareas sobre múltiples parámetros y programación reactiva basada en datasets.',
  },
  'apache-airflow': {
    title: 'Apache Airflow 3.3.0: Arquitectura de Orquestación y Datasets Dinámicos',
    url: 'https://airflow.apache.org/blog/airflow-3.3.0/',
    author: 'Apache Airflow PMC',
    summary: 'Mapeo dinámico de tareas sobre múltiples parámetros y programación reactiva basada en datasets.',
  },
  'dagster': {
    title: 'La Orquestación es más que Programación: Automatización Declarativa en Dagster',
    url: 'https://dagster.io/blog/orchestration-is-more-than-scheduling-declarative-automation-in-dagster',
    author: 'Sandy Ryza',
    summary: 'Automatización declarativa con bucles de reconciliación basados en estado y SLAs de frescura.',
  },
  'kafka': {
    title: 'Apache Kafka: Documentación Oficial de Arquitectura KRaft y Streaming',
    url: 'https://kafka.apache.org/documentation/',
    author: 'Apache Kafka PMC',
    summary: 'Arquitectura de streaming de eventos, quorum de metadatos KRaft y almacenamiento en capas.',
  },
  'apache-kafka': {
    title: 'Apache Kafka: Documentación Oficial de Arquitectura KRaft y Streaming',
    url: 'https://kafka.apache.org/documentation/',
    author: 'Apache Kafka PMC',
    summary: 'Arquitectura de streaming de eventos, quorum de metadatos KRaft y almacenamiento en capas.',
  },
  'spark': {
    title: 'Apache Spark: Novedades del Motor de Procesamiento y Spark Connect',
    url: 'https://spark.apache.org/news/index.html',
    author: 'Apache Spark PMC',
    summary: 'Ejecución desacoplada con Spark Connect y optimizaciones en Adaptive Query Execution.',
  },
  'apache-spark': {
    title: 'Apache Spark: Novedades del Motor de Procesamiento y Spark Connect',
    url: 'https://spark.apache.org/news/index.html',
    author: 'Apache Spark PMC',
    summary: 'Ejecución desacoplada con Spark Connect y optimizaciones en Adaptive Query Execution.',
  },
  'flink': {
    title: 'Apache Flink: Anuncio del FileSystem S3 Nativo para Streaming State Storage',
    url: 'https://flink.apache.org/2026/06/26/announcing-native-s3-fs/',
    author: 'Apache Flink Community',
    summary: 'FileSystem S3 nativo que optimiza subidas multi-parte y reduce la latencia en checkpoints.',
  },
  'apache-flink': {
    title: 'Apache Flink: Anuncio del FileSystem S3 Nativo para Streaming State Storage',
    url: 'https://flink.apache.org/2026/06/26/announcing-native-s3-fs/',
    author: 'Apache Flink Community',
    summary: 'FileSystem S3 nativo que optimiza subidas multi-parte y reduce la latencia en checkpoints.',
  },
  'trino': {
    title: 'Trino: Avances en Ejecución Tolerante a Fallos y Consultas Federadas',
    url: 'https://trino.io/blog/2026/07/18/a-pivotal-summer.html',
    author: 'Trino Community',
    summary: 'Ejecución distribuida tolerante a fallos, spooling para cargas batch y analítica en data lakes.',
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

// Apple-calibrated spring physics for instant, zero-lag shared layout morphing
const springTransition = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
  mass: 0.6,
};

// Fullscreen & Mobile-Optimized Morphing Modal with Directional Silky Navigation
function ExpandedToolModal({ 
  tool, 
  toolsList = [],
  onSelectTool,
  onClose 
}: { 
  tool: ToolDisplay; 
  toolsList?: ToolDisplay[];
  onSelectTool?: (tool: ToolDisplay) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [pkgManager, setPkgManager] = useState<'uv' | 'pip' | 'poetry'>('uv');
  const Icon = getToolIcon(tool.slug, tool.rawCategory);
  const semver = getSemverBadge(tool.version);

  const currentIndex = toolsList.findIndex((t) => t.slug === tool.slug);
  const totalCount = toolsList.length;

  const goToPrev = () => {
    if (!onSelectTool || totalCount === 0) return;
    setDirection(-1);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : totalCount - 1;
    onSelectTool(toolsList[prevIndex]);
  };

  const goToNext = () => {
    if (!onSelectTool || totalCount === 0) return;
    setDirection(1);
    const nextIndex = currentIndex < totalCount - 1 ? currentIndex + 1 : 0;
    onSelectTool(toolsList[nextIndex]);
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  // Lock background scroll & Keyboard Navigation (ESC, ArrowLeft, ArrowRight)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, currentIndex, totalCount, onSelectTool]);

  const { showToast } = useToast();

  const getInstallCmd = (pm: 'uv' | 'pip' | 'poetry') => {
    const cleanSlug = tool.slug.replace(/^apache-/, '');
    const cleanVer = tool.version.replace(/^v/, '');
    if (pm === 'uv') return `uv add ${cleanSlug}==${cleanVer}`;
    if (pm === 'pip') return `pip install ${cleanSlug}==${cleanVer}`;
    return `poetry add ${cleanSlug}@${cleanVer}`;
  };

  const installCommand = getInstallCmd(pkgManager);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    showToast(`Comando copiado (${pkgManager})`, installCommand);
    setTimeout(() => setCopied(false), 2000);
  };

  const meta = TOOL_METADATA[tool.slug] || TOOL_METADATA[tool.slug.replace(/^apache-/, '')] || {
    repo: `${tool.slug}/${tool.slug}`,
    license: 'Apache-2.0 / MIT (OSS)',
    runtime: 'Python / Distributed Native',
    layer: tool.category,
  };

  const getRiskAssessment = () => {
    if (tool.hasBreaking || semver.label === 'MAJOR') {
      return {
        level: 'Alto',
        label: 'Riesgo: Alto',
        detail: 'Requiere Staging',
        className: 'text-red-400 border-red-500/30 bg-red-950/40',
        dotClass: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]'
      };
    }
    if (semver.label === 'MINOR') {
      return {
        level: 'Medio',
        label: 'Riesgo: Medio',
        detail: 'Nuevas Features',
        className: 'text-amber-400 border-amber-500/30 bg-amber-950/40',
        dotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
      };
    }
    return {
      level: 'Bajo',
      label: 'Riesgo: Bajo',
      detail: 'Seguro en Prod',
      className: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
      dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
    };
  };

  const risk = getRiskAssessment();

  const copySlackSnippet = () => {
    const text = `🚀 *${tool.name} ${tool.version} Release Update*
• *Capa del Stack:* ${meta.layer}
• *Evaluación:* ${risk.label} (${risk.detail})
• *Breaking Changes:* ${tool.hasBreaking ? `${tool.breakingChanges?.length || 1} detectados` : 'Ninguno (Release Estable)'}
• *Instalación:* \`${installCommand}\`
• *Release Oficial:* ${tool.sourceUrl || `https://github.com/${meta.repo}/releases`}`;
    
    navigator.clipboard.writeText(text);
    showToast('Resumen para Slack copiado', 'Listo para pegar en tu canal de ingeniería');
  };

  const relatedArticle = TOOL_ARTICLES[tool.slug] || TOOL_ARTICLES[tool.slug.replace(/^apache-/, '')];

  return (
    <div key="active-tool-modal-overlay" className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
      {/* Backdrop with progressive blur */}
      <motion.div
        key="active-tool-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md pointer-events-auto cursor-pointer"
      />

      {/* Rock-Solid Modal Window Frame with Directional Content Crossfade */}
      <motion.div
        key="active-tool-modal-dialog"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.14 } }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tool-title-heading"
        drag={isMobile ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.02, bottom: 0.55 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 75 || info.velocity.y > 300) {
            onClose();
          }
        }}
        className="pointer-events-auto relative z-10 w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl max-h-[92vh] sm:max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col touch-pan-y shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
      >
        {/* Volumetric Reactive Ambient Glow with smooth color morphing */}
        <div 
          className={`absolute inset-0 pointer-events-none transition-all duration-700 ease-out rounded-t-[28px] sm:rounded-3xl ${
            tool.hasBreaking 
              ? 'bg-[radial-gradient(ellipse_75%_50%_at_0%_0%,rgba(239,68,68,0.14),transparent_70%)]' 
              : 'bg-[radial-gradient(ellipse_75%_50%_at_0%_0%,rgba(16,185,129,0.14),transparent_70%)]'
          }`} 
        />

        {/* Mobile Swipe Handle */}
        <div className="w-12 h-1.5 bg-neutral-700/80 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Scrollable Content Container */}
        <div className="p-6 sm:p-7 lg:p-8 overflow-y-auto flex flex-col gap-4 sm:gap-5 scrollbar-thin scrollbar-thumb-neutral-800 relative z-10">
          
          {/* Header Row: Icon + Title with Rolling Header + Navigation + Close Button */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="size-12 sm:size-14 rounded-2xl border border-neutral-800 bg-neutral-900 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                <Icon size={24} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <div className="overflow-hidden h-8 sm:h-9 flex items-center">
                  <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                    <motion.h3 
                      key={`title-${tool.slug}`}
                      custom={direction}
                      initial={{ y: direction > 0 ? 16 : -16, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: direction > 0 ? -16 : 16, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      id="tool-title-heading"
                      className="text-xl sm:text-3xl font-bold text-white tracking-tight truncate inline-block"
                    >
                      {tool.name}
                    </motion.h3>
                  </AnimatePresence>
                </div>
                <p className="font-mono text-xs text-neutral-400 uppercase tracking-wider mt-0.5 truncate">
                  {tool.category}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Tool Navigation [ ← 1/10 → ] */}
              {totalCount > 1 && (
                <div className="flex items-center gap-0.5 bg-neutral-900/90 border border-neutral-800 rounded-full px-2 py-1 text-xs font-mono text-neutral-400 shadow-inner">
                  <button
                    onClick={goToPrev}
                    className="p-1 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-neutral-800 active:scale-90"
                    title="Herramienta anterior (←)"
                    aria-label="Herramienta anterior"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-[11px] text-neutral-300 font-semibold px-1 select-none">
                    {currentIndex !== -1 ? currentIndex + 1 : 1}/{totalCount}
                  </span>
                  <button
                    onClick={goToNext}
                    className="p-1 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-neutral-800 active:scale-90"
                    title="Siguiente herramienta (→)"
                    aria-label="Siguiente herramienta"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}

              {/* Close Button */}
              <button
                aria-label="Cerrar detalle"
                onClick={onClose}
                className="size-10 sm:size-11 rounded-full border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 active:scale-90"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Smooth Linear Spring Carousel Track */}
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={tool.slug}
              custom={direction}
              variants={{
                enter: (dir: number) => ({
                  x: dir > 0 ? 36 : -36,
                  opacity: 0,
                  scale: 0.985,
                  filter: 'blur(2px)',
                }),
                center: {
                  x: 0,
                  opacity: 1,
                  scale: 1,
                  filter: 'blur(0px)',
                  transition: {
                    type: 'spring',
                    stiffness: 420,
                    damping: 34,
                    mass: 0.65,
                  },
                },
                exit: (dir: number) => ({
                  x: dir > 0 ? -36 : 36,
                  opacity: 0,
                  scale: 0.985,
                  filter: 'blur(2px)',
                  transition: {
                    duration: 0.13,
                    ease: [0.36, 0, 0.66, 0] as const,
                  },
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col gap-4 sm:gap-5"
            >
              {/* Version, Rolling Odometer, Risk Gauge & Slack Export Banner */}
              <div className="p-3.5 sm:p-4 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  {/* Rolling Version Number Odometer */}
                  <div className="overflow-hidden h-9 flex items-center">
                    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                      <motion.span
                        key={`ver-${tool.slug}-${tool.version}`}
                        custom={direction}
                        initial={{ y: direction > 0 ? 18 : -18, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: direction > 0 ? -18 : 18, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="font-mono text-2xl sm:text-3xl font-light text-white inline-block select-all"
                      >
                        {tool.version}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  {/* Rolling SemVer Badge */}
                  <div className="overflow-hidden inline-flex">
                    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                      <motion.span
                        key={`semver-${tool.slug}`}
                        initial={{ y: direction > 0 ? 12 : -12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: direction > 0 ? -12 : 12, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${semver.className} inline-block`}
                      >
                        {semver.label}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  {/* Rolling Risk Badge */}
                  <div className="overflow-hidden inline-flex">
                    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                      <motion.div
                        key={`risk-${tool.slug}`}
                        initial={{ y: direction > 0 ? 12 : -12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: direction > 0 ? -12 : 12, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${risk.className}`}
                      >
                        <span className={`size-1.5 rounded-full ${risk.dotClass}`} />
                        <span>{risk.label}</span>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={copySlackSnippet}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono text-neutral-300 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 hover:border-neutral-600 transition-colors cursor-pointer active:scale-95"
                    title="Copiar resumen en Markdown para Slack o Teams"
                  >
                    <MessageSquare size={12} className="text-emerald-400" />
                    <span>Slack / Teams</span>
                  </button>
                  <span className="text-xs text-neutral-400 font-mono">{tool.date}</span>
                </div>
              </div>

              {/* 2-Column Body Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
                {/* Left Column: Breaking Changes + Command + Summary */}
                <div className="lg:col-span-7 flex flex-col gap-3.5 sm:gap-4">
                  {/* Breaking Changes */}
                  {tool.hasBreaking ? (
                    <div className="p-4 rounded-2xl border border-red-500/30 bg-red-950/20 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-red-400 font-semibold text-xs sm:text-sm">
                        <AlertTriangle size={15} />
                        <span>Breaking Changes Detectados ({tool.breakingChanges?.length || 1})</span>
                      </div>
                      <ul className="space-y-1 text-xs text-neutral-300 leading-relaxed pl-1">
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
                            <span>Modificaciones en APIs o arquitecturas previas detectadas en el release. Se recomienda auditar el stack antes de actualizar.</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 flex items-center gap-2.5 text-emerald-400 text-xs">
                      <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                      <span>Release estable verificado sin breaking changes reportados. Actualización recomendada.</span>
                    </div>
                  )}

                  {/* Installation Command with Package Manager Switcher */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                          <TerminalIcon size={12} />
                          <span>Comando de Instalación</span>
                        </span>
                      </div>

                      {/* Package Manager Switcher Tabs */}
                      <div className="flex items-center gap-1 bg-neutral-900/90 p-0.5 rounded-lg border border-neutral-800">
                        {(['uv', 'pip', 'poetry'] as const).map((pm) => (
                          <button
                            key={pm}
                            onClick={() => setPkgManager(pm)}
                            className={`relative px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer ${
                              pkgManager === pm ? 'text-white font-bold bg-neutral-800 border border-neutral-700/60' : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                          >
                            <span>{pm}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-neutral-800 bg-black font-mono text-xs flex items-center justify-between gap-2">
                      <span className="text-emerald-400/90 select-all truncate">{installCommand}</span>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1 text-neutral-400 hover:text-emerald-400 transition-colors shrink-0 text-[11px] cursor-pointer"
                        title="Copiar comando"
                      >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex flex-col gap-1">
                    <h4 className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Propósito en el Ecosistema</h4>
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-light">
                      {tool.summary}
                    </p>
                  </div>
                </div>

                {/* Right Column: Deep-Dives Real + Architecture Specs + Shimmer CTA */}
                <div className="lg:col-span-5 flex flex-col gap-3.5 sm:gap-4 h-full justify-between">
                  {/* Related Real Technical Article Card */}
                  {relatedArticle ? (
                    <div className="p-3.5 sm:p-4 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 flex flex-col gap-2 relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                          <BookOpen size={13} className="text-emerald-400" />
                          <span>Deep-Dive Técnico</span>
                        </span>
                        <a 
                          href={relatedArticle.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>Leer</span>
                          <ArrowUpRight size={12} />
                        </a>
                      </div>
                      <a
                        href={relatedArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2"
                      >
                        {relatedArticle.title}
                      </a>
                      <p className="text-[11px] text-neutral-400 font-light leading-relaxed line-clamp-2">
                        {relatedArticle.summary}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-800/60">
                        <span>{relatedArticle.author}</span>
                        <a href="#articulos" onClick={onClose} className="hover:text-emerald-400 transition-colors">
                          Ver artículos →
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-neutral-200 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                          <BookOpen size={13} className="text-emerald-400" />
                          <span>Deep-Dives & Blogs</span>
                        </span>
                        <a 
                          href="#articulos" 
                          onClick={onClose}
                          className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <span>Ver artículos</span>
                          <span>→</span>
                        </a>
                      </div>
                      <p className="text-xs text-neutral-400 font-light leading-relaxed">
                        Revisa los análisis de arquitectura y resúmenes validados por IA sobre {tool.name} en la sección de artículos.
                      </p>
                    </div>
                  )}

                  {/* Architecture & Engineering Hardware Specs */}
                  <div className="p-3 sm:p-3.5 rounded-2xl border border-neutral-800/80 bg-neutral-900/30 flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                      <Cpu size={12} className="text-emerald-400" />
                      <span>Especificaciones de Ingeniería</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-neutral-500">Repo Oficial</span>
                        <a 
                          href={`https://github.com/${meta.repo}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-neutral-300 hover:text-emerald-400 truncate flex items-center gap-1 transition-colors"
                          title={meta.repo}
                        >
                          <span className="truncate">{meta.repo}</span>
                          <ArrowUpRight size={10} className="shrink-0 text-neutral-500" />
                        </a>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-neutral-500">Licencia</span>
                        <span className="text-neutral-300 truncate">{meta.license}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-neutral-500">Runtime</span>
                        <span className="text-neutral-300 truncate">{meta.runtime}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-neutral-500">Capa del Stack</span>
                        <span className="text-neutral-300 truncate">{meta.layer}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button with Metallic Shimmer & Tactile Elastic Press */}
                  <div className="pt-1">
                    <motion.a
                      href={tool.sourceUrl || `https://github.com/${meta.repo}/releases`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.96 }}
                      className="group relative w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-100 font-semibold py-3 px-5 rounded-xl text-xs sm:text-sm overflow-hidden shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      {/* Shimmer linear ray */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none" />
                      <span className="relative z-10">Ver Release Oficial en GitHub</span>
                      <ExternalLink size={14} className="relative z-10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </motion.a>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
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

// Pro-grade Interactive Tool Card — Clean 1:1 Shared Layout Morphing & GPU Glow (No CSS transform conflicts)
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

  // High-frequency GPU mouse tracking via useMotionValue (Zero React re-renders, 120fps)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  // Spotlight radial gradient (subtle metallic white/emerald reflection)
  const borderSpotlight = useMotionTemplate`radial-gradient(260px circle at ${mouseX}px ${mouseY}px, rgba(52, 211, 153, 0.12), transparent 80%)`;

  return (
    <motion.article
      layoutId={`tool-card-${tool.slug}`}
      transition={springTransition}
      style={{ willChange: 'transform' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(tool)}
      className="group relative overflow-hidden rounded-2xl bg-neutral-950/90 border border-neutral-800/80 hover:border-neutral-700 p-6 flex flex-col justify-between cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
    >
      {/* Subtle GPU Spotlight Glow Overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
        style={{
          background: borderSpotlight,
        }}
      />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          {/* Header: Icon with micro-elevation + Title + Category + Plus action */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <motion.div 
                layoutId={`tool-icon-${tool.slug}`}
                transition={springTransition}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-neutral-800/90 bg-neutral-900/90 text-neutral-300 group-hover:text-emerald-400 group-hover:border-neutral-700/80 group-hover:-translate-y-0.5 transition-all duration-200 shadow-inner"
              >
                <Icon size={20} strokeWidth={1.5} />
              </motion.div>
              <div>
                <motion.h3 
                  layoutId={`tool-title-${tool.slug}`}
                  transition={springTransition}
                  className="font-semibold text-base tracking-tight text-neutral-200 group-hover:text-white transition-colors duration-150"
                >
                  {tool.name}
                </motion.h3>
                <motion.p 
                  layoutId={`tool-category-${tool.slug}`}
                  transition={springTransition}
                  className="mt-0.5 font-mono text-[11px] text-neutral-500 group-hover:text-neutral-400 tracking-wider uppercase transition-colors duration-150"
                >
                  {tool.category}
                </motion.p>
              </div>
            </div>
            
            {/* Plus Button with elastic hover response */}
            <motion.div 
              layoutId={`tool-button-${tool.slug}`}
              transition={springTransition}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              className="size-7 rounded-lg border border-neutral-800/80 bg-neutral-900/50 group-hover:bg-neutral-800 group-hover:border-neutral-700 flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors duration-150"
            >
              <Plus 
                size={13} 
                className={`transition-transform duration-200 ${isHovered ? 'rotate-90 text-neutral-200' : ''}`} 
              />
            </motion.div>
          </div>

          {/* Telemetry Row: Version + SemVer Tag + Date */}
          <div className="mt-6 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2.5">
              <motion.span 
                layoutId={`tool-version-${tool.slug}`}
                transition={springTransition}
                className="font-mono text-2xl md:text-3xl font-light tracking-tight text-neutral-100 group-hover:text-white transition-colors duration-150"
              >
                {tool.version}
              </motion.span>
              <motion.span 
                layoutId={`tool-badge-${tool.slug}`}
                transition={springTransition}
                className={`font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded border ${semver.className}`}
              >
                {semver.label}
              </motion.span>
            </div>
            <span className="text-xs font-light text-neutral-500 font-mono">
              {tool.date}
            </span>
          </div>

          {/* Status Alert Badge */}
          <div className="mt-3.5">
            {tool.hasBreaking ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/20 bg-rose-950/20 px-2 py-0.5 font-mono text-[10px] text-rose-300">
                <span className="size-1.5 rounded-full bg-rose-400" />
                Breaking Changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800/80 bg-neutral-900/40 px-2 py-0.5 font-mono text-[10px] text-neutral-400">
                <span className="size-1.5 rounded-full bg-emerald-400/80" />
                Release Estable
              </span>
            )}
          </div>

          {/* Summary Description */}
          <p className="mt-4 text-sm leading-relaxed text-neutral-400 font-light line-clamp-2">
            {tool.summary}
          </p>
        </div>

        {/* Technical Footer: Slug + Subtle Micro-arrow Animation */}
        <div className="mt-6 pt-4 border-t border-neutral-900/90 flex items-center justify-between">
          <span className="font-mono text-xs text-neutral-600 group-hover:text-neutral-300 transition-colors duration-150">
            {getToolRepoSlug(tool.slug)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-mono text-neutral-400 group-hover:text-white transition-colors duration-150">
            <span>Detalles</span>
            <ArrowUpRight size={13} className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-400" />
          </span>
        </div>
      </div>
    </motion.article>
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

      {/* Morphing Expandable Modal Dialog (Smooth Shared Layout & Navigation) */}
      <AnimatePresence>
        {selectedTool && (
          <ExpandedToolModal 
            tool={selectedTool} 
            toolsList={filteredTools.length > 0 ? filteredTools : allTools}
            onSelectTool={(t) => setSelectedTool(t)}
            onClose={() => setSelectedTool(null)} 
          />
        )}
      </AnimatePresence>

    </section>
  );
}
