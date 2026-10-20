'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import type { WizardOption } from '@/lib/roadmap';
import type { RetoEntry } from '@/lib/db';
import {
  ChevronRight,
  Target,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { RevealButton } from '@/components/ui/reveal-button';
import { useRetoChecklist } from '@/lib/useRetoChecklist';
import { RetoSpecCard } from './RetoSpecCard';
import { RetoChecklistSection } from './RetoChecklistSection';
import { RetoPostmortemsSection } from './RetoPostmortemsSection';
import { RetoIntegridadCard } from './RetoIntegridadCard';
import { RetoWorkbenchSidebar } from './RetoWorkbenchSidebar';

interface RetoWorkbenchViewProps {
  objetivo: WizardOption;
  reto: RetoEntry;
  otroReto: {
    slug: string;
    nombre: string;
    descripcion: string;
    checklistCount: number;
  } | null;
}

export function RetoWorkbenchView({
  objetivo,
  reto,
  otroReto,
}: RetoWorkbenchViewProps) {
  const validSlugs = useMemo(() => reto.checklist.map((c) => c.slug), [reto.checklist]);
  const { checkedSlugs, toggle, reset } = useRetoChecklist(reto.objetivo_slug, validSlugs);

  const dominioMap: Record<string, string> = {
    'pipelines-batch': 'PIPELINES BATCH & IDEMPOTENCIA',
    'modelado-analitico': 'OLAP & MODELADO DIMENSIONAL',
    streaming: 'STREAMING & TIEMPO REAL',
    'plataforma-cloud': 'PLATAFORMA CLOUD & FINOPS',
    'ruta-completa': 'ARQUITECTURA COMPLETA',
  };

  const dominio = dominioMap[objetivo.slug] || 'DATA ENGINEERING CORE';
  const conFalla = reto.checklist.filter((item) => Boolean(item.experiencia_texto));

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-full max-w-[1200px] -translate-x-1/2 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(6,182,212,0.08),rgba(0,0,0,0))] blur-3xl"
      />

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24">
        {/* 1. Technical Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-neutral-400"
        >
          <Link href="/" className="hover:text-neutral-300 transition-colors">
            Inicio
          </Link>
          <ChevronRight size={11} className="text-neutral-500 shrink-0" />
          <Link href="/practica" className="hover:text-neutral-300 transition-colors">
            Práctica
          </Link>
          <ChevronRight size={11} className="text-neutral-500 shrink-0" />
          <Link href="/practica#retos" className="hover:text-cyan-400 transition-colors">
            Retos de Arquitectura
          </Link>
          <ChevronRight size={11} className="text-neutral-500 shrink-0" />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/50 border border-cyan-800/40 text-cyan-300 font-medium truncate max-w-[240px] sm:max-w-none">
            <span className="size-1 rounded-full bg-cyan-400" />
            {objetivo.nombre}
          </span>
        </nav>

        {/* 2. Top Telemetry Spec Ribbon */}
        <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-mono text-neutral-400 border-b border-neutral-800/80 pb-3.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-cyan-400 font-semibold">
            <Target size={12} className="text-cyan-400" />
            <span>[07.B] // RETO DE ARQUITECTURA REAL</span>
          </div>
          <span className="text-neutral-700 select-none">·</span>
          <span>
            DOMINIO: <strong className="text-neutral-200 font-normal">{dominio}</strong>
          </span>
          <span className="text-neutral-700 select-none hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            EJECUCIÓN: <strong className="text-neutral-200 font-normal">LOCAL-FIRST (SIN MOCKS)</strong>
          </span>
          <span className="text-neutral-700 select-none hidden md:inline">·</span>
          <span className="text-cyan-400/90 hidden md:inline">
            {reto.checklist.length} CRITERIOS DE DOMINIO
          </span>
          <span className="text-neutral-700 select-none hidden lg:inline">·</span>
          <span className="text-amber-400/90 hidden lg:inline">
            {conFalla.length} POSTMORTEMS DOCUMENTADOS
          </span>
        </div>

        {/* 3. Hero Header Section */}
        <header className="mb-10 sm:mb-12">
          <div className="max-w-4xl">
            <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white uppercase">
              {objetivo.nombre}
            </h1>
            <p className="mt-4 font-sans text-base sm:text-lg leading-relaxed text-neutral-300">
              {objetivo.descripcion.trim()}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <RevealButton href="#checklist" size="md">
              Comenzar Verificación
            </RevealButton>

            <Link
              href="/practica"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-2.5 font-mono text-xs text-neutral-300 transition-colors hover:border-neutral-700 hover:text-white"
            >
              <ArrowLeft size={14} />
              <span>Directorio de Práctica</span>
            </Link>

            <a
              href="https://github.com/JeanArdila711/data-engineering"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-800/80 bg-neutral-950/60 px-4 py-2.5 font-mono text-xs text-neutral-400 transition-colors hover:border-neutral-700 hover:text-cyan-300"
            >
              <span>Ver Repo DE Radar</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </header>

        {/* 4. Panoramic 2-Column Workbench Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Column: Engineering Dossier (8 cols) */}
          <main className="lg:col-span-8 space-y-12 sm:space-y-16">
            {/* A. The Technical Scenario Brief */}
            {reto.escenario && (
              <RetoSpecCard
                objetivoSlug={reto.objetivo_slug}
                objetivoNombre={objetivo.nombre}
                escenario={reto.escenario}
              />
            )}

            {/* B. Interactive Acceptance Criteria & Code Review Checklist */}
            <RetoChecklistSection
              checklist={reto.checklist}
              checkedSlugs={checkedSlugs}
              onToggle={toggle}
              onReset={reset}
            />

            {/* C. Incident Postmortems ("Esto es lo que se rompe") */}
            <RetoPostmortemsSection conFalla={conFalla} />

            {/* D. Aerospace Engineering Integrity Plaque ("No hay una solución que comparar") */}
            <RetoIntegridadCard />
          </main>

          {/* Sidebar Column: Sticky Workbench HUD & Telemetry (4 cols) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28">
            <RetoWorkbenchSidebar
              checklist={reto.checklist}
              checkedSlugs={checkedSlugs}
              conFallaCount={conFalla.length}
              otroReto={otroReto}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
