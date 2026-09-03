'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WizardOption } from '@/lib/roadmap';
import { RevealButton } from '@/components/ui/reveal-button';
import { ScrollRevealTitle } from '@/components/ui/scroll-reveal-title';
import { Target } from 'lucide-react';

const PARTIDA_BADGES: Record<string, { badge: string; note: string }> = {
  'desde-cero': {
    badge: 'Inicio Absoluto',
    note: 'Recorre todos los niveles desde fundamentos (Terminal, Git, Python y SQL).',
  },
  'ya-programo': {
    badge: 'Base en Código',
    note: 'Da por sabidos los lenguajes base y arranca directo en ingesta desacoplada.',
  },
  'ya-muevo-datos': {
    badge: 'Ingeniería Activa',
    note: 'Focaliza en arquitectura analítica avanzada, SCD2, orquestación y fallos reales.',
  },
};

export default function RoadmapWizard({ opciones }: { opciones: WizardOption[] }) {
  const objetivos = opciones.filter(o => o.kind === 'objetivo');
  const partidas = opciones.filter(o => o.kind === 'partida');

  const [selectedObjetivo, setSelectedObjetivo] = useState(objetivos[0]?.slug ?? '');
  const [selectedPartida, setSelectedPartida] = useState(partidas[0]?.slug ?? '');

  if (objetivos.length === 0 || partidas.length === 0) return null;

  const currentObjetivo = objetivos.find(o => o.slug === selectedObjetivo) ?? objetivos[0];
  const currentPartida = partidas.find(p => p.slug === selectedPartida) ?? partidas[0];

  return (
    <section id="armar" className="mx-auto max-w-5xl scroll-mt-24 px-5 md:px-6 py-12 md:py-16">
      {/* 1. Header with Eyebrow and Headline */}
      <div className="flex flex-col gap-2.5 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-[11px] font-mono text-emerald-400 w-fit">
          <Target size={13} className="text-emerald-400" />
          <span>[05.1] // GENERADOR DETERMINISTA DE SUBGRAFO</span>
        </div>

        <ScrollRevealTitle
          text="Armá tu rumbo personalizado"
          as="h2"
          className="text-2xl sm:text-4xl font-bold tracking-tight uppercase leading-[1.1]"
        />
        <p className="text-neutral-400 text-sm md:text-base font-light leading-relaxed max-w-2xl">
          Dos preguntas. La ruta sale del grafo topológico según dependencias técnicas reales, no de una plantilla ni de un LLM: mismas respuestas, misma ruta.
        </p>
      </div>

      {/* 2. Interactive Form with Dual Balanced Columns */}
      <form action="/ruta/ir" method="get" className="grid gap-8 md:grid-cols-2 items-start">
        
        {/* Columna 1: ¿Hasta dónde querés llegar? (5 Objetivos) */}
        <fieldset className="space-y-3">
          <legend className="mb-3 text-xs font-mono uppercase tracking-widest text-neutral-400 flex items-center justify-between w-full">
            <span className="text-emerald-400 font-semibold">[Paso 1]</span>
            <span>¿Hasta dónde querés llegar?</span>
          </legend>

          {objetivos.map((o, i) => {
            const isSelected = selectedObjetivo === o.slug;
            return (
              <motion.label
                key={o.slug}
                onClick={() => setSelectedObjetivo(o.slug)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.1 }}
                className="group relative flex cursor-pointer items-start gap-3.5 rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 transition-colors duration-150 select-none overflow-hidden hover:border-neutral-700"
              >
                {/* 1. Marco Deslizante Líquido (layoutId Morph - Opción 1) */}
                {isSelected && (
                  <motion.div
                    layoutId="active-objetivo-highlight"
                    className="absolute inset-0 rounded-xl border border-emerald-500/70 bg-emerald-950/25 shadow-[0_0_24px_rgba(16,185,129,0.12)] pointer-events-none z-0"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}

                {/* Native Radio (Hidden for a11y & standard form submit) */}
                <input
                  type="radio"
                  name="objetivo"
                  value={o.slug}
                  checked={isSelected}
                  onChange={() => setSelectedObjetivo(o.slug)}
                  required
                  className="sr-only"
                />

                {/* Custom Radio Dot Indicator with layoutId traveling dot (Opción 1) */}
                <div
                  className={`relative z-10 mt-0.5 size-4.5 rounded-full border shrink-0 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-950'
                      : 'border-neutral-700 bg-neutral-900 group-hover:border-neutral-600'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="active-objetivo-dot"
                      className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    />
                  )}
                </div>

                <div className="relative z-10 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-neutral-200'}`}>
                      {o.nombre}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                      0{i + 1}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400 font-light leading-relaxed">
                    {o.descripcion.trim()}
                  </p>
                </div>
              </motion.label>
            );
          })}
        </fieldset>

        {/* Columna 2: ¿De dónde arrancás? (3 Partidas + Panel de Acción) */}
        <div className="flex flex-col gap-3">
          <fieldset className="space-y-3">
            <legend className="mb-3 text-xs font-mono uppercase tracking-widest text-neutral-400 flex items-center justify-between w-full">
              <span className="text-emerald-400 font-semibold">[Paso 2]</span>
              <span>¿De dónde arrancás?</span>
            </legend>

            {partidas.map(p => {
              const isSelected = selectedPartida === p.slug;
              const meta = PARTIDA_BADGES[p.slug] || { badge: 'Partida', note: '' };

              return (
                <motion.label
                  key={p.slug}
                  onClick={() => setSelectedPartida(p.slug)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.1 }}
                  className="group relative flex cursor-pointer items-start gap-3.5 rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 transition-colors duration-150 select-none overflow-hidden hover:border-neutral-700"
                >
                  {/* 1. Marco Deslizante Líquido (layoutId Morph - Opción 1) */}
                  {isSelected && (
                    <motion.div
                      layoutId="active-partida-highlight"
                      className="absolute inset-0 rounded-xl border border-emerald-500/70 bg-emerald-950/25 shadow-[0_0_24px_rgba(16,185,129,0.12)] pointer-events-none z-0"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}

                  {/* Native Radio (Hidden for a11y & standard form submit) */}
                  <input
                    type="radio"
                    name="partida"
                    value={p.slug}
                    checked={isSelected}
                    onChange={() => setSelectedPartida(p.slug)}
                    required
                    className="sr-only"
                  />

                  {/* Custom Radio Dot Indicator with layoutId traveling dot (Opción 1) */}
                  <div
                    className={`relative z-10 mt-0.5 size-4.5 rounded-full border shrink-0 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-950'
                        : 'border-neutral-700 bg-neutral-900 group-hover:border-neutral-600'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="active-partida-dot"
                        className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                    )}
                  </div>

                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-semibold tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-neutral-200'}`}>
                        {p.nombre}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-neutral-800 bg-neutral-900/80 text-neutral-400">
                        {meta.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-400 font-light leading-relaxed">
                      {p.descripcion.trim()}
                    </p>
                  </div>
                </motion.label>
              );
            })}
          </fieldset>

          {/* Panel Bento de Resumen y Lanzamiento de Ruta */}
          <div className="p-5 rounded-2xl border border-neutral-800/90 bg-neutral-950/90 flex flex-col gap-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] mt-1">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="uppercase tracking-wider">Configuración Activa</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase">Sin Alucinaciones</span>
            </div>

            {/* Odometer Telemetry Text Transition (Opción 1) */}
            <div className="space-y-2 text-xs text-neutral-400 font-mono">
              <div className="flex justify-between items-center h-6">
                <span className="text-neutral-500 shrink-0">Objetivo:</span>
                <div className="relative overflow-hidden h-5 flex items-center justify-end ml-2">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={currentObjetivo.slug}
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -7 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="text-neutral-200 font-sans font-medium text-right truncate"
                    >
                      {currentObjetivo.nombre}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex justify-between items-center h-6">
                <span className="text-neutral-500 shrink-0">Partida:</span>
                <div className="relative overflow-hidden h-5 flex items-center justify-end ml-2">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={currentPartida.slug}
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -7 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="text-neutral-200 font-sans font-medium text-right truncate"
                    >
                      {currentPartida.nombre}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* RevealButton as the Submit Button */}
            <div className="pt-2">
              <RevealButton
                type="submit"
                size="md"
                className="w-full justify-center shadow-[0_0_24px_rgba(255,255,255,0.18)]"
              >
                Generar mi ruta personalizada
              </RevealButton>
            </div>

            <p className="text-[11px] text-neutral-500 text-center font-mono">
              Sin auth ni registros · Genera una URL canónica y compartible
            </p>
          </div>

        </div>
      </form>
    </section>
  );
}
