'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  Terminal, 
  Database, 
  ShieldCheck, 
  ExternalLink, 
  ArrowUp,
  Cpu,
  Layers,
  Sparkles,
  GitBranch,
  Zap,
  Star
} from 'lucide-react';

export default function Footer() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <footer className="w-full border-t border-neutral-800/80 bg-neutral-950 text-neutral-400 relative z-10 overflow-hidden font-sans">
      
      {/* Background Subpixel Grid & Ambient Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(52,211,153,0.06),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-5 md:px-6 py-12 md:py-16 relative z-10">
        
        {/* 1. Live Telemetry Strip */}
        <div className="mb-12 p-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Pipeline Status</div>
              <div className="text-xs font-mono font-medium text-emerald-400">100% Sincronizado</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Database size={16} className="text-neutral-500" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Almacenamiento</div>
              <div className="text-xs font-mono font-medium text-neutral-200">PostgreSQL (Neon)</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Cpu size={16} className="text-neutral-500" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Control de Calidad</div>
              <div className="text-xs font-mono font-medium text-neutral-200">Anclaje IA con NLI</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Layers size={16} className="text-neutral-500" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Ecosistema Core</div>
              <div className="text-xs font-mono font-medium text-neutral-200">10 Motores Oficiales</div>
            </div>
          </div>
        </div>

        {/* 2. Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-neutral-800/80">
          
          {/* Brand & Community Actions (Opción 3) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white font-bold tracking-tight text-lg">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              <span>DE RADAR</span>
            </div>
            
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed max-w-sm">
              Plataforma de inteligencia técnica automatizada para Data Engineers. Rastreo de releases, detección de breaking changes y resúmenes de arquitectura sin ruido corporativo.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 mt-2">
              <a
                href="https://github.com/JeanArdila711/data-engineering/issues/new?title=%5BSuggestion%5D+Agregar+nuevo+motor+al+Radar&body=%23%23+Herramienta+Sugerida%0A%0A-%20**Nombre:**%20%0A-%20**Repositorio:**%20%0A-%20**Categor%C3%ADa:**%20%0A-%20**Por+qu%C3%A9+deber%C3%ADa+estar+en+el+Radar:**%20"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 transition-all font-medium active:scale-95 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
              >
                <Zap size={13} className="text-emerald-400" />
                <span>Sugerir Motor / Contribuir</span>
                <ExternalLink size={11} className="text-emerald-400/70" />
              </a>

              <a
                href="https://github.com/JeanArdila711/data-engineering"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/70 hover:border-neutral-600 transition-colors active:scale-95"
              >
                <GitBranch size={13} className="text-neutral-400" />
                <span>Repositorio</span>
                <ExternalLink size={11} className="text-neutral-500" />
              </a>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-semibold">
              Navegación
            </h4>
            <ul className="flex flex-col gap-2 text-xs font-mono text-neutral-400">
              <li>
                <a href="#radar" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="text-neutral-600 font-bold">01</span> Radar & Terminal
                </a>
              </li>
              <li>
                <a href="#manifiesto" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="text-neutral-600 font-bold">02</span> Manifiesto de Ingeniería
                </a>
              </li>
              <li>
                <a href="#ecosystem" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="text-neutral-600 font-bold">03</span> Ecosistema & Releases
                </a>
              </li>
              <li>
                <a href="#articulos" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="text-neutral-600 font-bold">04</span> Blogs & Deep-Dives
                </a>
              </li>
              <li>
                <a href="#digest" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="text-neutral-600 font-bold">05</span> Digest Semanal
                </a>
              </li>
            </ul>
          </div>

          {/* Keyboard Shortcuts & Telemetry Info */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-semibold">
              Atajos de Teclado
            </h4>
            <div className="flex flex-col gap-2.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
                <span className="text-neutral-400">Command Palette Global</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-200">
                  ⌘K / Ctrl+K
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
                <span className="text-neutral-400">Cerrar Modal / Detalle</span>
                <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-200">
                  ESC
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Legal & Back-to-Top Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
          <div>
            © {new Date().getFullYear()} DE Radar. Construido con arquitectura de datos real.
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span>Volver arriba</span>
            <ArrowUp size={13} className="text-emerald-400" />
          </button>
        </div>
      </div>
    </footer>
  );
}
