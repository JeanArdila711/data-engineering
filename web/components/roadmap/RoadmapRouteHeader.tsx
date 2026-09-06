'use client';

import React from 'react';
import Link from 'next/link';
import type { RoadmapNode, WizardOption } from '@/lib/roadmap';
import { Target, ArrowLeft, CheckCircle2, Terminal, ChevronRight } from 'lucide-react';
import { RevealButton } from '@/components/ui/reveal-button';
import ShareButton from './ShareButton';
import DimensionalStudio from './DimensionalStudio';
import BatchPipelineStudio from './BatchPipelineStudio';
import StreamingStudio from './StreamingStudio';
import CloudPlatformStudio from './CloudPlatformStudio';
import TopologicalStudio from './TopologicalStudio';

interface RoadmapRouteHeaderProps {
  objetivo: WizardOption;
  partida: WizardOption;
  total: number;
  sabidos: RoadmapNode[];
  parrafo?: string | null;
}

export default function RoadmapRouteHeader({
  objetivo,
  partida,
  total,
  sabidos,
  parrafo,
}: RoadmapRouteHeaderProps) {
  // Dominio técnico según objetivo
  const dominioMap: Record<string, string> = {
    'modelado-analitico': 'OLAP & MODELADO DIMENSIONAL',
    'pipelines-batch': 'PIPELINES BATCH & IDEMPOTENCIA',
    'streaming': 'STREAMING & TIEMPO REAL',
    'plataforma-cloud': 'PLATAFORMA CLOUD & FINOPS',
    'ruta-completa': 'ARQUITECTURA COMPLETA',
  };

  const dominio = dominioMap[objetivo.slug] || 'DATA ENGINEERING CORE';

  // Contexto pedagógico del punto de partida
  const deltaPartida =
    partida.slug === 'desde-cero'
      ? 'Ruta completa (Fundamentos Nivel 0 incluidos)'
      : partida.slug === 'ya-programo'
      ? 'Avanzado: omitidos 4 nodos de base (Python/SQL/Git)'
      : partida.slug === 'ya-muevo-datos'
      ? 'Frontera: omitidos 12 nodos de base e ingesta inicial'
      : `${partida.nombre}`;

  return (
    <header className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-6">
      
      {/* 1. Breadcrumb de Navegación Técnico */}
      <nav aria-label="Breadcrumb" className="mb-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-neutral-500">
        <Link href="/" className="hover:text-neutral-300 transition-colors">
          Inicio
        </Link>
        <ChevronRight size={11} className="text-neutral-700 shrink-0" />
        <Link href="/ruta" className="hover:text-neutral-300 transition-colors">
          Rumbo
        </Link>
        <ChevronRight size={11} className="text-neutral-700 shrink-0" />
        <Link href="/ruta#armar" className="text-neutral-400 hover:text-cyan-400 transition-colors truncate max-w-[200px] sm:max-w-none">
          {objetivo.nombre}
        </Link>
        <ChevronRight size={11} className="text-neutral-700 shrink-0" />
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/50 border border-cyan-800/40 text-cyan-300 font-medium">
          <span className="size-1 rounded-full bg-cyan-400" />
          {partida.nombre}
        </span>
      </nav>

      {/* 2. Cinta Superior de Telemetría (Spec Sheet Compacto) */}
      <div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-mono text-neutral-400 border-b border-neutral-800/80 pb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-cyan-400 font-semibold">
          <Target size={12} className="text-cyan-400" />
          <span>[05] // RUMBO PERSONALIZADO</span>
        </div>
        <span className="text-neutral-700 select-none">·</span>
        <span className="text-neutral-400">
          DOMINIO: <strong className="text-neutral-200 font-normal">{dominio}</strong>
        </span>
        <span className="text-neutral-700 select-none hidden sm:inline">·</span>
        <span className="text-neutral-400 hidden sm:inline">
          ENTRADA: <strong className="text-neutral-200 font-normal uppercase">{partida.nombre}</strong>
        </span>
        <span className="text-neutral-700 select-none hidden md:inline">·</span>
        <span className="text-cyan-400/90 hidden md:inline">
          {total} NODOS EN GRAFO
        </span>
      </div>

      {/* 3. Distribución Vertical: Hero Superior + Studio Panorámico Inferior */}
      <div className="flex flex-col gap-8 lg:gap-10">
        
        {/* BLOQUE SUPERIOR: El Hero Completo y Justificación Pedagógica */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-6 xl:gap-8 items-start">
          
          {/* Columna Izquierda: Titular H1, Descripción, Bento Chips y Acciones */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-white uppercase leading-[1.06] text-balance">
                {objetivo.nombre}
              </h1>
              <p className="mt-3 text-neutral-400 text-sm sm:text-base font-light leading-relaxed max-w-2xl">
                {objetivo.descripcion.trim()}
              </p>
            </div>

            {/* Bento Chips Técnicos de Telemetría (De Opción 3) */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 font-mono text-[11px]">
              <div className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-cyan-400" />
                <span>{total} Nodos en Grafo</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
                <span className="text-amber-400">⚡</span>
                <span>{objetivo.slug === 'pipelines-batch' ? 'Idempotente (Zero-Loss)' : objetivo.slug === 'streaming' ? 'At-Least-Once & Low-Latency' : objetivo.slug === 'plataforma-cloud' ? 'FinOps & Serverless ($0/mes)' : objetivo.slug === 'ruta-completa' ? '34 Nodos · Kahn O(V+E)' : objetivo.slug === 'modelado-analitico' ? 'SCD Tipo 2 & Kimball' : 'Arquitectura Real'}</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 flex items-center gap-1.5 hidden sm:flex">
                <span className="text-emerald-400">✓</span>
                <span>Nivel: {partida.nombre}</span>
              </div>
            </div>

            {/* Fila de Acciones: RevealButton + Compartir + Cambiar respuestas */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <RevealButton href="#rumbo" size="sm" className="shadow-[0_0_24px_rgba(255,255,255,0.12)]">
                Explorar los {total} nodos
              </RevealButton>
              <ShareButton />
              <Link
                href="/ruta#armar"
                className="text-xs font-mono text-neutral-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 underline-offset-4 hover:underline ml-1"
              >
                <ArrowLeft size={13} />
                <span>Cambiar respuestas</span>
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Vuelo / Por Qué Este Orden + Estado de Partida */}
          <div className="flex flex-col gap-3">
            {parrafo && (
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/90 p-4 sm:p-5 relative shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Terminal size={13} className="text-cyan-400" />
                    <span>// Por qué este orden en tu ruta</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-normal lowercase font-sans">
                    anclado al grafo
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                  {parrafo}
                </p>

                <div className="pt-2.5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 text-[11px]">Partida:</span>
                    <span className="text-neutral-200 font-sans text-[11px] font-medium px-2 py-0.5 rounded-full border border-neutral-800 bg-neutral-900/90">
                      {partida.nombre}
                    </span>
                    <span className="text-[10px] text-neutral-400 hidden xl:inline">
                      ({deltaPartida})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-semibold">
                    <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>{total} activos</span>
                  </div>
                </div>
              </div>
            )}

            {/* Nodos Sabidos Colapsables (si aplica) */}
            {sabidos.length > 0 && (
              <details className="rounded-xl border border-neutral-800/60 bg-neutral-950/40 p-3 text-xs font-mono text-neutral-400 group">
                <summary className="cursor-pointer hover:text-neutral-200 transition-colors flex items-center gap-2 select-none">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>
                    Omitidos <strong className="text-neutral-200 font-normal">{sabidos.length} nodos</strong> por tu punto de partida (clic para ver)
                  </span>
                </summary>
                <ul className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-neutral-800/60 font-sans">
                  {sabidos.map(n => (
                    <li
                      key={n.slug}
                      className="rounded-full border border-neutral-800 bg-neutral-900/80 px-2.5 py-0.5 text-[11px] text-neutral-300"
                    >
                      {n.nombre}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

        </div>

        {/* BLOQUE INFERIOR: El Artefacto Técnico Panorámico a Pantalla Completa */}
        <div className="w-full relative">
          {/* Ambient Glow de Fondo (De Opción 2) */}
          <div
            className={`absolute -inset-2 rounded-3xl blur-2xl -z-10 opacity-30 pointer-events-none ${
              objetivo.slug === 'pipelines-batch'
                ? 'bg-amber-500/15'
                : objetivo.slug === 'streaming'
                ? 'bg-violet-500/20'
                : objetivo.slug === 'plataforma-cloud'
                ? 'bg-sky-500/20'
                : objetivo.slug === 'ruta-completa'
                ? 'bg-emerald-500/20'
                : 'bg-cyan-500/15'
            }`}
          />

          {objetivo.slug === 'pipelines-batch' ? (
            <BatchPipelineStudio />
          ) : objetivo.slug === 'streaming' ? (
            <StreamingStudio />
          ) : objetivo.slug === 'plataforma-cloud' ? (
            <CloudPlatformStudio />
          ) : objetivo.slug === 'ruta-completa' ? (
            <TopologicalStudio />
          ) : (
            <DimensionalStudio objetivoSlug={objetivo.slug} />
          )}
        </div>

      </div>

    </header>
  );
}
