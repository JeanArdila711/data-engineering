'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  ChevronRight,
  Workflow,
  Database,
  Terminal,
  ShieldCheck,
  RotateCcw,
  ArrowDown,
} from 'lucide-react';
import { RevealButton } from '@/components/ui/reveal-button';

interface PreflightCheck {
  id: string;
  status: 'pass' | 'warn' | 'done';
  label: string;
  detail: string;
  tag?: string;
}

const PREFLIGHT_DATA: Record<
  'pipelines-batch' | 'modelado-analitico',
  {
    title: string;
    domain: string;
    command: string;
    icon: typeof Workflow;
    accentColor: string;
    checks: PreflightCheck[];
  }
> = {
  'pipelines-batch': {
    title: 'pipelines-batch // preflight-check',
    domain: 'ORQUESTACIÓN & PIPELINES BATCH',
    command: 'pytest tests/test_batch_idempotency.py -v',
    icon: Workflow,
    accentColor: 'text-amber-400',
    checks: [
      {
        id: '1',
        status: 'pass',
        label: 'Ingesta cruda en raw_fetches',
        detail: 'SHA-256 idempotente verificado. Cero mutación en staging.',
        tag: 'PASS',
      },
      {
        id: '2',
        status: 'pass',
        label: 'Simulación de doble corrida diaria',
        detail: 'Ejecutado x2 contra Postgres: 0 filas duplicadas en fct_release.',
        tag: 'PASS',
      },
      {
        id: '3',
        status: 'warn',
        label: 'Aislamiento Dead-Letter ante API 429',
        detail: 'Incidente real #bc8f179: excepción aislada sin tumbar la corrida.',
        tag: 'INCIDENTE',
      },
      {
        id: '4',
        status: 'pass',
        label: 'Detección de SemVer no estructurado',
        detail: 'Trino tag entero preservado en raw_version sin forzar .0.0.',
        tag: 'PASS',
      },
      {
        id: '5',
        status: 'done',
        label: 'Pipeline validado corriendo',
        detail: 'Garantía matemática de reproducibilidad en tu propio entorno.',
        tag: 'VERIFICADO',
      },
    ],
  },
  'modelado-analitico': {
    title: 'modelado-analitico // preflight-check',
    domain: 'OLAP & KIMBALL DIMENSIONAL',
    command: 'dbt test --select mart_changelog,dim_tool',
    icon: Database,
    accentColor: 'text-cyan-400',
    checks: [
      {
        id: '1',
        status: 'pass',
        label: 'Granularidad de tabla de hechos',
        detail: 'Grano: 1 fila por release por herramienta. PK natural verificada.',
        tag: 'PASS',
      },
      {
        id: '2',
        status: 'pass',
        label: 'Historización SCD Tipo 2 en dim_tool',
        detail: 'valid_from / valid_to activos. Range join temporal en changelog.',
        tag: 'PASS',
      },
      {
        id: '3',
        status: 'warn',
        label: 'Auditoría contra sobreescritura pura (SCD1)',
        detail: 'Incidente real #3f7c81a: actualización sin historia pierde tier.',
        tag: 'INCIDENTE',
      },
      {
        id: '4',
        status: 'pass',
        label: 'Batería de tests dbt (41/41 en verde)',
        detail: 'Integridad referencial, not_null y accepted_values aprobados.',
        tag: 'PASS',
      },
      {
        id: '5',
        status: 'done',
        label: 'Modelo analítico verificado',
        detail: 'Esquema estrella consultable sin duplicar métricas en joins.',
        tag: 'VERIFICADO',
      },
    ],
  },
};

export default function PracticaHero() {
  const [activeTab, setActiveTab] = useState<'pipelines-batch' | 'modelado-analitico'>(
    'pipelines-batch'
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(5);

  const activePreflight = PREFLIGHT_DATA[activeTab];

  const handleSimulate = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(0);

    const interval = setInterval(() => {
      setSimulationStep(prev => {
        if (prev >= 5) {
          clearInterval(interval);
          setIsSimulating(false);
          return 5;
        }
        return prev + 1;
      });
    }, 400);
  };

  return (
    <header className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12 relative">
      {/* 1. Breadcrumb Técnico Jerárquico */}
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-neutral-500">
        <Link href="/" className="hover:text-neutral-300 transition-colors">
          Inicio
        </Link>
        <ChevronRight size={11} className="text-neutral-700 shrink-0" />
        <span className="text-neutral-300">Práctica</span>
        <ChevronRight size={11} className="text-neutral-700 shrink-0" />
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-medium">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Workbench de Ingeniería
        </span>
      </nav>

      {/* 2. Grid Panorámico 60/40 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Lado Izquierdo (60%): Manifiesto, Propuesta de Valor & Acciones */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-[11px] font-mono text-emerald-400 w-fit backdrop-blur-sm shadow-[0_0_16px_rgba(52,211,153,0.08)]"
          >
            <Dumbbell size={13} className="text-emerald-400" />
            <span>[07] // PRÁCTICA · WORKBENCH DE INGENIERÍA</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tighter text-white uppercase leading-[1.05] text-balance font-heading"
          >
            Entrená con fallas reales, <br className="hidden sm:inline" />
            no con ejercicios de juguete.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="text-neutral-400 text-sm sm:text-base font-light leading-relaxed max-w-2xl"
          >
            Dos mecanismos complementarios: un <strong className="font-medium text-neutral-200">directorio curado</strong> para ejercitar habilidades atómicas en plataformas de referencia, y <strong className="font-medium text-neutral-200">retos de punta a punta</strong> autoevaluados en tu propia infraestructura, con checklist derivado de la disciplina y fallas reales documentadas en producción.
          </motion.p>

          {/* Botones de Acción Insignia (White Luxury) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-3 pt-1"
          >
            <RevealButton href="#retos" size="md">
              Explorar Retos de Punta a Punta
            </RevealButton>
            <a
              href="#directorio"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950/70 text-neutral-300 text-xs font-mono font-medium hover:text-white hover:border-neutral-700 hover:bg-neutral-900/60 transition-all"
            >
              <span>Directorio de Habilidades Atómicas</span>
              <ArrowDown size={13} className="text-neutral-400" />
            </a>
          </motion.div>

          {/* Cinta HUD de Telemetría (Bento Chips) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="pt-4 border-t border-neutral-800/80 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-mono text-neutral-400"
          >
            <div className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span><strong className="text-white font-semibold">2 Retos</strong> End-to-End</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-cyan-400" />
              <span><strong className="text-white font-semibold">4 Plataformas</strong> Curadas</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
              <span className="text-amber-400">⚡</span>
              <span><strong className="text-white font-semibold">0 Calificación</strong> por LLM</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span><strong className="text-white font-semibold">100%</strong> En tu Máquina</span>
            </div>
          </motion.div>
        </div>

        {/* Lado Derecho (40%): Consola Interactiva workbench-preflight.sh */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5"
        >
          <div className="rounded-2xl border border-neutral-800/90 bg-neutral-950/95 shadow-2xl overflow-hidden font-mono text-xs flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.6)]">
            {/* Header de Ventana de Terminal */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-red-500/80" />
                  <div className="size-2.5 rounded-full bg-amber-500/80" />
                  <div className="size-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] ml-2">
                  <Terminal size={12} className="text-neutral-500" />
                  <span>workbench-preflight.sh</span>
                </div>
              </div>

              <div className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={11} />
                <span>Testbed Activo</span>
              </div>
            </div>

            {/* Pestañas de Retos de Ingeniería */}
            <div className="flex border-b border-neutral-800 bg-neutral-950 relative">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pipelines-batch');
                  setSimulationStep(5);
                  setIsSimulating(false);
                }}
                className="relative flex-1 px-3.5 py-2 text-[11px] font-mono border-r border-neutral-800/80 transition-colors flex items-center justify-center gap-1.5 select-none"
              >
                {activeTab === 'pipelines-batch' && (
                  <motion.div
                    layoutId="preflight-active-tab"
                    className="absolute inset-0 bg-neutral-900/90 border-b-2 border-amber-400 z-0"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Workflow
                    size={12}
                    className={activeTab === 'pipelines-batch' ? 'text-amber-400' : 'text-neutral-500'}
                  />
                  <span
                    className={
                      activeTab === 'pipelines-batch'
                        ? 'text-amber-400 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }
                  >
                    Pipelines Batch
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('modelado-analitico');
                  setSimulationStep(5);
                  setIsSimulating(false);
                }}
                className="relative flex-1 px-3.5 py-2 text-[11px] font-mono transition-colors flex items-center justify-center gap-1.5 select-none"
              >
                {activeTab === 'modelado-analitico' && (
                  <motion.div
                    layoutId="preflight-active-tab"
                    className="absolute inset-0 bg-neutral-900/90 border-b-2 border-cyan-400 z-0"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Database
                    size={12}
                    className={activeTab === 'modelado-analitico' ? 'text-cyan-400' : 'text-neutral-500'}
                  />
                  <span
                    className={
                      activeTab === 'modelado-analitico'
                        ? 'text-cyan-400 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }
                  >
                    Modelado Analítico
                  </span>
                </span>
              </button>
            </div>

            {/* Comando y Dominio Activo */}
            <div className="px-4 py-2 bg-neutral-900/40 border-b border-neutral-800/60 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400 font-mono text-[10px] truncate max-w-[260px]">
                $ {activePreflight.command}
              </span>
              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline-offset-2 hover:underline cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={10} className={isSimulating ? 'animate-spin' : ''} />
                <span>{isSimulating ? 'Verificando...' : 'Re-ejecutar'}</span>
              </button>
            </div>

            {/* Lista de Criterios del Preflight */}
            <div className="p-3.5 sm:p-4 space-y-2.5 bg-black/80 min-h-[240px]">
              {activePreflight.checks.map((check, index) => {
                const isVisible = index < simulationStep;
                if (!isVisible) {
                  return (
                    <div
                      key={check.id}
                      className="flex items-start gap-2.5 opacity-30 text-[11px] font-mono"
                    >
                      <span className="text-neutral-600 select-none">[PEND]</span>
                      <span className="text-neutral-600">{check.label}</span>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={check.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start gap-2 text-[11px] font-mono leading-tight"
                  >
                    {check.status === 'pass' && (
                      <span className="text-emerald-400 select-none shrink-0">[PASS]</span>
                    )}
                    {check.status === 'warn' && (
                      <span className="text-amber-400 select-none shrink-0">[WARN]</span>
                    )}
                    {check.status === 'done' && (
                      <span className="text-cyan-400 select-none shrink-0">[DONE]</span>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-neutral-200 font-medium">{check.label}</span>
                        {check.tag && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded border font-mono shrink-0 ${
                              check.status === 'pass'
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                                : check.status === 'warn'
                                ? 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                                : 'bg-cyan-950/60 text-cyan-400 border-cyan-800/40'
                            }`}
                          >
                            {check.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-neutral-400 font-sans font-light mt-0.5">
                        {check.detail}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer de Consola: Principio Innegociable */}
            <div className="px-4 py-2.5 bg-neutral-900/80 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-500">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>Zero-Mock: validación corriendo en local</span>
              </span>
              <a
                href={`/practica/${activeTab}`}
                className="text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1 font-mono"
              >
                <span>Abrir reto</span>
                <ChevronRight size={10} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
