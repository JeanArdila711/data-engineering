'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RevealButton } from '@/components/ui/reveal-button';
import {
  Workflow,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Cpu,
  Terminal,
  ArrowRight,
  GitBranch,
  Network,
  Activity,
  Boxes,
  Compass
} from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  level: string;
  nodesCount: number;
  color: string;
  borderColor: string;
  bgColor: string;
  tools: string[];
  description: string;
}

const STAGES: Stage[] = [
  {
    id: 'fase-0',
    name: '0. Fundamentos',
    level: 'NIVEL 0',
    nodesCount: 4,
    color: 'text-neutral-300',
    borderColor: 'border-neutral-700',
    bgColor: 'bg-neutral-900/60',
    tools: ['Python Core', 'SQL Relacional', 'Git & Commits', 'Bash / Linux'],
    description: 'Bases indispensables: lógica de datos, consultas atómicas y control de versiones.'
  },
  {
    id: 'fase-1',
    name: '1. Ingesta & Lake',
    level: 'NIVEL 1',
    nodesCount: 8,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-950/20',
    tools: ['APIs & Rate Limits', 'Content-Hash Dedup', 'Particionado S3', 'Parquet / ZSTD'],
    description: 'Entrada de datos: extracción resiliente, almacenamiento columnar y cero duplicados.'
  },
  {
    id: 'fase-2',
    name: '2. Modelado & QA',
    level: 'NIVEL 2',
    nodesCount: 12,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgColor: 'bg-cyan-950/20',
    tools: ['Star Schema', 'SCD Tipo 2', 'dbt-core Marts', 'Integrity Tests'],
    description: 'Transformación analítica: preservación del histórico y pruebas automatizadas.'
  },
  {
    id: 'fase-3',
    name: '3. Streaming & Cloud',
    level: 'NIVEL 3',
    nodesCount: 10,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/40',
    bgColor: 'bg-violet-950/20',
    tools: ['Kafka Partitions', 'Consumer Lag', 'Terraform IaC', 'FinOps ($0/mes)'],
    description: 'Producción masiva: baja latencia, auto-escalado y optimización de costos.'
  }
];

export default function TopologicalStudio() {
  const [isRunningKahn, setIsRunningKahn] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<'algorithm' | 'lineage' | 'code'>('algorithm');

  // Simulación interactiva del Algoritmo de Kahn
  const handleRunKahnSort = () => {
    if (isRunningKahn) return;
    setIsRunningKahn(true);
    setActiveStep(0);

    // Resuelve secuencialmente por in-degree y nivel
    setTimeout(() => setActiveStep(1), 700);
    setTimeout(() => setActiveStep(2), 1400);
    setTimeout(() => setActiveStep(3), 2100);
    setTimeout(() => {
      setActiveStep(-1);
      setIsRunningKahn(false);
    }, 2900);
  };

  return (
    <div className="rounded-2xl border border-neutral-800/90 bg-neutral-950/95 shadow-2xl overflow-hidden font-mono text-xs flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.6)]">
      
      {/* 1. Header de Consola Maestra (Algoritmo de Kahn / Topological Engine) */}
      <div className="px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 text-[10px] font-bold">
            <Compass size={11} className="text-emerald-400" />
            <span>KAHN TOPOLOGICAL ENGINE</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-300 text-[11px] font-medium">
            <Workflow size={13} className="text-cyan-400" />
            <span>dag: de_radar_master_topology_v1</span>
          </div>
        </div>

        {/* Botón de Simulación de Ordenamiento Topológico con RevealButton */}
        <RevealButton
          onClick={handleRunKahnSort}
          disabled={isRunningKahn}
          size="sm"
          variant="gradient"
          hideArrow
          className="text-[11px] font-mono py-1 px-3"
        >
          {isRunningKahn ? (
            <>
              <RotateCcw size={12} className="animate-spin text-neutral-950 shrink-0" />
              <span>Calculando In-Degrees...</span>
            </>
          ) : (
            <>
              <Play size={12} className="fill-current shrink-0" />
              <span>Simular Ordenamiento de Kahn</span>
            </>
          )}
        </RevealButton>
      </div>

      {/* 2. Barra de Telemetría Global del Grafo Completo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-neutral-800/80 border-b border-neutral-800/80">
        <div className="p-2.5 bg-neutral-950 flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Grafo Completo</span>
          <span className="text-xs sm:text-sm font-bold text-white font-mono flex items-center gap-1">
            <Boxes size={13} className="text-cyan-400" />
            34 Nodos Activos
          </span>
          <span className="text-[9px] text-neutral-500">Unión de todo el stack</span>
        </div>

        <div className="p-2.5 bg-neutral-950 flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Aristas & Dependencias</span>
          <span className="text-xs sm:text-sm font-bold text-amber-400 font-mono flex items-center gap-1">
            <GitBranch size={13} />
            48 Aristas (Edges)
          </span>
          <span className="text-[9px] text-neutral-500">Prerrequisitos estrictos</span>
        </div>

        <div className="p-2.5 bg-neutral-950 flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Profundidad Máxima</span>
          <span className="text-xs sm:text-sm font-bold text-violet-400 font-mono">
            6 Niveles Secuenciales
          </span>
          <span className="text-[9px] text-neutral-500">Sin saltos mágicos</span>
        </div>

        <div className="p-2.5 bg-neutral-950 flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Aciclicidad</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono flex items-center gap-1">
            <ShieldCheck size={13} />
            0 Ciclos (DAG Puro)
          </span>
          <span className="text-[9px] text-neutral-500">100% Determinista</span>
        </div>
      </div>

      {/* 3. Mapa de Arquitectura End-to-End en 4 Estaciones Panorámicas */}
      <div className="p-3 sm:p-4 bg-neutral-950/90 border-b border-neutral-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
            <Network size={12} className="text-emerald-400" />
            Las 4 Estaciones del Grafo (De Fundamentos a Plataforma)
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {isRunningKahn ? 'Resolviendo dependencias en vivo...' : 'Orden topológico estable'}
          </span>
        </div>

        {/* Las 4 Estaciones en Grid Panorámico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STAGES.map((stage, idx) => {
            const isStepActive = isRunningKahn && activeStep === idx;

            return (
              <div
                key={stage.id}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  isStepActive
                    ? 'border-emerald-400 bg-emerald-950/30 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse'
                    : `${stage.borderColor} ${stage.bgColor}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-[11px] ${stage.color}`}>
                    {stage.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono">
                    {stage.nodesCount} nodos
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[10px] text-neutral-300 bg-black/60 p-2 rounded-lg border border-neutral-800/80">
                  {stage.tools.map((t, i) => (
                    <div key={i} className="flex items-center gap-1.5 truncate">
                      <span className={`size-1 rounded-full ${isStepActive ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                      <span className="truncate">{t}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-neutral-400 font-sans leading-snug">
                  {stage.description}
                </p>

                <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[9px] text-neutral-500 font-mono">
                  <span>{stage.level}</span>
                  <span className={isStepActive ? 'text-emerald-400 font-bold' : 'text-neutral-400'}>
                    {isStepActive ? 'RESOLVIENDO...' : 'LISTO'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Selector de Pestañas y Panel Técnico Panorámico (3 Columnas) */}
      <div className="p-3 sm:p-4 bg-neutral-950/95 flex flex-col gap-3">
        {/* Selector de Pestaña */}
        <div className="flex border-b border-neutral-800 pb-2 gap-2 text-[11px] font-mono">
          <button
            onClick={() => setActiveTab('algorithm')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'algorithm'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu size={12} className={activeTab === 'algorithm' ? 'text-emerald-400' : 'text-neutral-500'} />
            <span>Algoritmo de Kahn (Por qué este orden)</span>
          </button>

          <button
            onClick={() => setActiveTab('lineage')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'lineage'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Workflow size={12} className={activeTab === 'lineage' ? 'text-emerald-400' : 'text-neutral-500'} />
            <span>Linaje de Datos End-to-End</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal size={12} className={activeTab === 'code' ? 'text-emerald-400' : 'text-neutral-500'} />
            <span>Código Real (ordenarTopologico)</span>
          </button>
        </div>

        {/* Paneles Panorámicos en 3 Columnas según Pestaña */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_1.2fr] gap-3 text-[11px]">
          
          {/* Columna 1: Decisión Técnica y Razón de Ser */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                {'// Decisión de Arquitectura Pedagógica'}
              </span>
              <p className="text-neutral-300 font-sans leading-relaxed text-xs">
                {activeTab === 'algorithm'
                  ? 'Un grafo acíclico no admite atajos: nadie puede dominar dbt sin entender joins relacionales en SQL, ni orquestar Airflow sin entender el concepto de idempotencia. El orden no es una opinión, es una dependencia matemática.'
                  : activeTab === 'lineage'
                  ? 'Trazabilidad total: cada release analizado en este radar pasa por raw_fetches (S3/Postgres), se limpia con dbt, se modela en SCD Tipo 2 y se expone sin que un breaking change de upstream corrompa los marts analíticos.'
                  : 'Desempate determinista: dos corridas sobre el mismo grafo producen exactamente el mismo orden gracias a la tupla (nivel, orden_sugerido, slug). Es el mismo contrato compartido entre Python y Next.js.'}
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
              <span>Resolución de dependencias:</span>
              <span className="text-emerald-400 font-mono font-semibold">100% Determinista</span>
            </div>
          </div>

          {/* Columna 2: Garantías del Grafo y Cobertura */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between gap-2">
            <div className="space-y-2">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block">
                {'// Métricas de Cobertura'}
              </span>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">Nodos sin Prerrequisitos:</span>
                <span className="text-neutral-200 font-mono">4 de Nivel 0 (Raíz)</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">Aristas Activas:</span>
                <span className="text-amber-400 font-mono">48 relaciones dirigidas</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">Ciclos Circulares:</span>
                <span className="text-emerald-400 font-mono">0 (Rechazados por CI)</span>
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <ShieldCheck size={13} />
              <span>Contrato verificado con test fixtures</span>
            </div>
          </div>

          {/* Columna 3: Código Real del Algoritmo de Kahn */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-black/80 font-mono text-[10px] sm:text-[11px] leading-relaxed overflow-x-auto text-neutral-300 flex flex-col justify-between">
            <div className="text-neutral-500 italic mb-1">
              {'// web/lib/roadmap.ts :: ordenarTopologico'}
            </div>
            <pre className="text-cyan-300 whitespace-pre font-mono">
{`const comparar = (a: string, b: string) => {
  const x = porSlug.get(a)!, y = porSlug.get(b)!
  return (
    x.nivel - y.nivel ||
    x.orden_sugerido - y.orden_sugerido ||
    (a < b ? -1 : a > b ? 1 : 0)
  )
}
// Resuelve la cola de in-degree = 0
while (listos.length > 0) { ... }`}
            </pre>
            <div className="mt-2 text-right">
              <span className="text-[9px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                Kahn Algorithm (O(V + E))
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
