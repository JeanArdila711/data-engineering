'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RevealButton } from '@/components/ui/reveal-button';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  ShieldCheck,
  Workflow,
  Cpu,
  Terminal,
  Database,
  Layers,
  ArrowRight,
  Clock,
  Radio
} from 'lucide-react';

interface TaskRun {
  id: string;
  name: string;
  shortDesc: string;
  duration: string;
  historyStatus: ('success' | 'quarantine' | 'queued' | 'running')[];
  details: {
    category: string;
    metric: string;
    metricLabel: string;
    rule: string;
    codeSnippet: string;
  };
}

const TASKS: TaskRun[] = [
  {
    id: 'extract_github_api',
    name: '1. extract_github_api',
    shortDesc: 'Paginación keyset + Backoff con Jitter',
    duration: '840ms',
    historyStatus: ['success', 'success', 'success', 'success', 'success'],
    details: {
      category: 'EXTRACCIÓN RESILIENTE',
      metric: '4,892 / 5,000 req/hr',
      metricLabel: 'Cuota GitHub API Restante',
      rule: 'Backoff exponencial: 2s -> 4s -> 8s + jitter aleatorio para prevenir efecto avalancha (thundering herd).',
      codeSnippet: `_PER_PAGE = 100
_MAX_PAGES = 10  # Tope de seguridad: +913 releases recuperados sin loop infinito`
    }
  },
  {
    id: 'content_hash_dedup',
    name: '2. content_hash_dedup',
    shortDesc: 'Deduplicación SHA-256 en raw_fetches',
    duration: '120ms',
    historyStatus: ['success', 'success', 'success', 'success', 'success'],
    details: {
      category: 'IDEMPOTENCIA MATEMÁTICA',
      metric: '0 filas duplicadas',
      metricLabel: 'Integridad en Reintentos',
      rule: 'Se quitan reacciones y descargas volátiles antes del hash: misma release = mismo SHA-256 siempre.',
      codeSnippet: `INSERT INTO raw_fetches (source_id, content_hash, payload)
VALUES (%s, %s, %s)
ON CONFLICT (source_id, content_hash) DO UPDATE
SET last_seen_ds = GREATEST(raw_fetches.last_seen_ds, EXCLUDED.last_seen_ds);`
    }
  },
  {
    id: 'quarantine_filter',
    name: '3. quarantine_filter',
    shortDesc: 'Aislamiento Dead-Letter sin abortar lote',
    duration: '45ms',
    historyStatus: ['success', 'quarantine', 'success', 'success', 'quarantine'],
    details: {
      category: 'RESILIENCIA ANTE DATOS SUCIOS',
      metric: '1 registro aislado',
      metricLabel: 'Cuarentena (Dead-Letter)',
      rule: 'Los registros con SemVer corrupto van a quarantine_log. El 99.9% de los datos sanos continúa sin pausa.',
      codeSnippet: `if not is_valid_semver(tag_name):
    quarantine.append({"raw": payload, "reason": "invalid_semver", "ts": now()})
    continue  # No aborta el pipeline completo`
    }
  },
  {
    id: 'dbt_marts_transform',
    name: '4. dbt_marts_transform',
    shortDesc: 'Atomic Upsert & Tests de Calidad',
    duration: '1.42s',
    historyStatus: ['success', 'success', 'success', 'success', 'success'],
    details: {
      category: 'TRANSFORMACIÓN ANALÍTICA',
      metric: '41 / 41 Tests en Verde',
      metricLabel: 'Integridad Referencial',
      rule: 'Join temporal con dim_tool (SCD2). Inserción transaccional atómica en PostgreSQL.',
      codeSnippet: `INSERT INTO fct_release (tool_slug, version, published_at)
VALUES (%s, %s, %s)
ON CONFLICT (tool_slug, version) DO NOTHING;`
    }
  }
];

const RUN_DATES = ['01 Sep', '02 Sep', '03 Sep', '04 Sep', 'Hoy (06:00)'];

export default function BatchPipelineStudio() {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('content_hash_dedup');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [runLogs, setRunLogs] = useState<string[]>([
    '06:00:01 [CRON] Trigger programado diario iniciado.',
    '06:00:02 [EXTRACT] 182 releases obtenidos desde GitHub API (200 OK).',
    '06:00:02 [DEDUP] 182/182 hashes SHA-256 contrastados en raw_fetches.',
    '06:00:03 [SANITY] 1 entrada malformada enviada a quarantine_log.',
    '06:00:04 [SUCCESS] dbt marts completado en 1.4s. 0 duplicados insertados.'
  ]);

  const selectedTask = TASKS.find(t => t.id === selectedTaskId) || TASKS[1];

  // Simulación de ejecución interactiva del DAG
  const handleTriggerDagRun = () => {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentStepIndex(0);
    setRunLogs([
      `[MANUAL RUN] Trigger manual disparado. Simulando re-ejecución inmediata...`
    ]);

    // Paso 1
    setTimeout(() => {
      setCurrentStepIndex(1);
      setRunLogs(prev => [
        ...prev,
        `[TASK 1/4] extract_github_api: 182 items leídos de cache/API con backoff OK.`
      ]);
    }, 700);

    // Paso 2
    setTimeout(() => {
      setCurrentStepIndex(2);
      setRunLogs(prev => [
        ...prev,
        `[TASK 2/4] content_hash_dedup: 182 SHA-256 coinciden. ON CONFLICT DO UPDATE -> 0 inserts.`
      ]);
    }, 1400);

    // Paso 3
    setTimeout(() => {
      setCurrentStepIndex(3);
      setRunLogs(prev => [
        ...prev,
        `[TASK 3/4] quarantine_filter: 1 registro aislado en dead-letter. Lote sano protegido.`
      ]);
    }, 2100);

    // Paso 4: Finalización
    setTimeout(() => {
      setCurrentStepIndex(-1);
      setIsRunning(false);
      setRunLogs(prev => [
        ...prev,
        `[SUCCESS] DAG Finalizado en 2.8s. Idempotencia 100% verificada: 0 efectos colaterales.`
      ]);
    }, 2800);
  };

  return (
    <div className="rounded-2xl border border-neutral-800/90 bg-neutral-950/95 shadow-2xl overflow-hidden font-mono text-xs flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.6)]">
      
      {/* 1. Header de Consola de Orquestación (Estilo Airflow/Dagster Industrial) */}
      <div className="px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-700/50 text-amber-400 text-[10px] font-bold">
            <Radio size={11} className="animate-pulse text-amber-400" />
            <span>AIRFLOW DAG ORCHESTRATOR</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-300 text-[11px] font-medium">
            <Workflow size={13} className="text-amber-400" />
            <span>dag_id: github_releases_sync</span>
          </div>
        </div>

        {/* Botón de Disparo de DAG Run Interactivo con RevealButton */}
        <RevealButton
          onClick={handleTriggerDagRun}
          disabled={isRunning}
          size="sm"
          hideArrow
          className="text-[11px] font-mono py-1 px-3 shadow-[0_0_20px_rgba(255,255,255,0.12)]"
        >
          {isRunning ? (
            <>
              <RotateCcw size={12} className="animate-spin text-neutral-950" />
              <span>Ejecutando DAG...</span>
            </>
          ) : (
            <>
              <Play size={12} className="fill-current" />
              <span>Simular Re-ejecución</span>
            </>
          )}
        </RevealButton>
      </div>

      {/* 2. Barra de Telemetría del Orquestador */}
      <div className="px-4 py-2 bg-neutral-950 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-[10px] text-neutral-400">
        <div className="flex items-center gap-3">
          <span>Cron: <strong className="text-neutral-200 font-normal">06:00 UTC Diario</strong></span>
          <span className="text-neutral-700">·</span>
          <span>Max Active Runs: <strong className="text-neutral-200 font-normal">1 (Sin solapamiento)</strong></span>
          <span className="text-neutral-700 hidden sm:inline">·</span>
          <span className="text-emerald-400 hidden sm:inline">SLA: 100% On-Time</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
          <Clock size={11} />
          <span>Última corrida: Hace 42 min (Éxito)</span>
        </div>
      </div>

      {/* 3. Matriz de Tareas por Fecha (Task Execution Matrix) */}
      <div className="p-3 sm:p-4 bg-neutral-950 border-b border-neutral-800/80">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
            <Layers size={12} className="text-amber-400" />
            Matriz de Ejecución de Tareas (Últimos 5 Días)
          </span>
          <span className="text-[9px] text-neutral-500 font-sans">Clic en una tarea para inspeccionar su telemetría</span>
        </div>

        {/* Encabezado de Fechas */}
        <div className="grid grid-cols-[150px_repeat(5,1fr)] md:grid-cols-[280px_repeat(5,1fr)] gap-1.5 pb-1.5 text-[10px] text-neutral-500 font-mono text-center border-b border-neutral-800/50 mb-1.5">
          <div className="text-left pl-1">Tarea / Operación en Pipeline</div>
          {RUN_DATES.map((date, idx) => (
            <div key={date} className={idx === 4 ? 'text-amber-400 font-bold' : ''}>
              {date}
            </div>
          ))}
        </div>

        {/* Filas de Tareas */}
        <div className="space-y-1.5">
          {TASKS.map((task, taskIdx) => {
            const isSelected = selectedTaskId === task.id;
            const isTaskSimulating = isRunning && currentStepIndex === taskIdx;

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`grid grid-cols-[150px_repeat(5,1fr)] md:grid-cols-[280px_repeat(5,1fr)] gap-1.5 p-2 rounded-xl cursor-pointer transition-all items-center ${
                  isSelected
                    ? 'bg-neutral-900/90 border border-amber-500/40 shadow-sm'
                    : 'bg-neutral-950/60 hover:bg-neutral-900/40 border border-transparent'
                }`}
              >
                {/* Nombre de la Tarea y Descripción */}
                <div className="text-left pl-1 truncate flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`size-1.5 rounded-full shrink-0 ${isSelected ? 'bg-amber-400' : 'bg-neutral-600'}`} />
                    <span className={`text-[11px] font-medium truncate ${isSelected ? 'text-amber-300' : 'text-neutral-300'}`}>
                      {task.name.split('. ')[1]}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 truncate hidden md:block pl-3 font-sans">
                    {task.shortDesc}
                  </span>
                </div>

                {/* Celdas de la Matriz (Estados por Fecha) */}
                {task.historyStatus.map((status, colIdx) => {
                  const isTodayCol = colIdx === 4;

                  if (isTodayCol && isTaskSimulating) {
                    return (
                      <div
                        key={colIdx}
                        className="h-8 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center text-[10px] font-bold animate-pulse"
                      >
                        RUNNING
                      </div>
                    );
                  }

                  if (status === 'quarantine') {
                    return (
                      <div
                        key={colIdx}
                        className="h-8 rounded-lg bg-amber-950/40 border border-amber-600/50 text-amber-400 flex items-center justify-center text-[10px] font-bold"
                        title="1 anomalía enviada a cuarentena (Dead-Letter)"
                      >
                        QUAR
                      </div>
                    );
                  }

                  return (
                    <div
                      key={colIdx}
                      className="h-8 rounded-lg bg-emerald-950/40 border border-emerald-700/50 text-emerald-400 flex items-center justify-center text-[10px] font-bold hover:bg-emerald-900/50 transition-colors"
                      title="Éxito limpio (0 duplicados)"
                    >
                      SUCCESS
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Inspector de la Tarea Seleccionada */}
      <div className="p-3 sm:p-4 bg-neutral-950/90 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded">
              {selectedTask.details.category}
            </span>
            <span className="text-neutral-200 text-xs font-bold">{selectedTask.name}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 text-neutral-400">
              <span>{selectedTask.details.metricLabel}:</span>
              <strong className="text-emerald-400 font-bold">{selectedTask.details.metric}</strong>
            </div>
          </div>
        </div>

        {/* Regla de Ingeniería, Telemetría y Código Real (Grid Panorámico 3 Columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_1.2fr] gap-3 text-[11px]">
          {/* Columna 1: Razón de Diseño / Regla */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                {'// Decisión de Ingeniería'}
              </span>
              <p className="text-neutral-300 font-sans leading-relaxed text-xs">
                {selectedTask.details.rule}
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
              <span>Duración promedio:</span>
              <span className="text-amber-300 font-mono font-semibold">{selectedTask.duration}</span>
            </div>
          </div>

          {/* Columna 2: Telemetría Operativa y Garantías */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between gap-2">
            <div className="space-y-2">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block">
                {'// Garantía Operativa'}
              </span>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">Comportamiento:</span>
                <span className="text-emerald-400 font-mono font-semibold">100% Idempotente</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">Efecto en Reintento:</span>
                <span className="text-neutral-200 font-mono">0 mutaciones espurias</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">Aislamiento de Errores:</span>
                <span className="text-amber-400 font-mono">Dead-letter queue</span>
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <ShieldCheck size={13} />
              <span>Zero-Data-Loss verificado</span>
            </div>
          </div>

          {/* Columna 3: Fragmento de Código o SQL Real */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-black/80 font-mono text-[10px] sm:text-[11px] leading-relaxed overflow-x-auto text-neutral-300 flex flex-col justify-between">
            <div className="text-neutral-500 italic mb-1">
              {'-- pipeline implementation snippet'}
            </div>
            <pre className="text-cyan-300 whitespace-pre font-mono">
              {selectedTask.details.codeSnippet}
            </pre>
            <div className="mt-2 text-right">
              <span className="text-[9px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                Atómico & Transaccional
              </span>
            </div>
          </div>
        </div>

        {/* 5. Consola Terminal con Logs de Ejecución */}
        <div className="p-2.5 rounded-xl border border-neutral-800/80 bg-black/90 font-mono text-[10px] text-neutral-400 space-y-1">
          <div className="flex items-center justify-between text-neutral-500 pb-1 border-b border-neutral-900">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <Terminal size={11} className="text-amber-400" />
              Live DAG Stdout Console
            </span>
            <span className="text-[9px]">PostgreSQL 16 // Neon</span>
          </div>
          <div className="space-y-0.5 max-h-16 overflow-y-auto scrollbar-none pt-0.5 text-neutral-300 font-mono">
            {runLogs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('[SUCCESS]')
                    ? 'text-emerald-400 font-bold'
                    : log.includes('[MANUAL RUN]')
                    ? 'text-amber-400'
                    : 'text-neutral-400'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
