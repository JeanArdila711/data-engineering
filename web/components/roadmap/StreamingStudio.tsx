'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RevealButton } from '@/components/ui/reveal-button';
import {
  Zap,
  Activity,
  Radio,
  Clock,
  Layers,
  ShieldCheck,
  Cpu,
  Workflow,
  ArrowRight,
  Database,
  RefreshCw,
  Terminal,
  Sparkles,
  Gauge,
  SlidersHorizontal
} from 'lucide-react';

interface StreamEvent {
  id: string;
  ts: string;
  partition: number;
  tool: string;
  version: string;
  latencyMs: number;
}

const INITIAL_EVENTS: StreamEvent[] = [
  { id: 'ev-101', ts: '21:22:04.102', partition: 0, tool: 'duckdb', version: 'v1.2.0', latencyMs: 11 },
  { id: 'ev-102', ts: '21:22:04.148', partition: 1, tool: 'apache-airflow', version: 'v2.10.4', latencyMs: 8 },
  { id: 'ev-103', ts: '21:22:04.210', partition: 2, tool: 'dbt-core', version: 'v1.9.0', latencyMs: 14 },
  { id: 'ev-104', ts: '21:22:04.285', partition: 0, tool: 'apache-kafka', version: 'v3.9.0', latencyMs: 9 },
  { id: 'ev-105', ts: '21:22:04.340', partition: 1, tool: 'trino', version: 'v468', latencyMs: 12 },
];

export default function StreamingStudio() {
  const [isSpiking, setIsSpiking] = useState<boolean>(false);
  const [throughput, setThroughput] = useState<number>(1420);
  const [consumerLag, setConsumerLag] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'windows' | 'topology' | 'code'>('windows');
  const [events, setEvents] = useState<StreamEvent[]>(INITIAL_EVENTS);

  // Simulación de spike de tráfico y recuperación de lag (Backpressure)
  const handleTriggerSpike = () => {
    if (isSpiking) return;
    setIsSpiking(true);
    setThroughput(4850);
    setConsumerLag(384);

    // Agregamos eventos rápidos
    const newSpikeEvent: StreamEvent = {
      id: `ev-${Date.now().toString().slice(-4)}`,
      ts: new Date().toISOString().slice(11, 23),
      partition: Math.floor(Math.random() * 3),
      tool: 'spike-batch-traffic',
      version: 'BURST-TEST',
      latencyMs: 38
    };
    setEvents(prev => [newSpikeEvent, ...prev.slice(0, 4)]);

    // Simula que el consumidor auto-escala y drena el lag progresivamente
    setTimeout(() => {
      setConsumerLag(180);
      setThroughput(3200);
    }, 1200);

    setTimeout(() => {
      setConsumerLag(45);
      setThroughput(2100);
    }, 2200);

    setTimeout(() => {
      setConsumerLag(0);
      setThroughput(1420);
      setIsSpiking(false);
    }, 3200);
  };

  return (
    <div className="rounded-2xl border border-neutral-800/90 bg-neutral-950/95 shadow-2xl overflow-hidden font-mono text-xs flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.6)]">
      
      {/* 1. Header de Consola de Streaming (Estilo Redpanda/Confluent táctico) */}
      <div className="px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-violet-950/60 border border-violet-700/50 text-violet-400 text-[10px] font-bold">
            <Radio size={11} className="animate-pulse text-violet-400" />
            <span>KAFKA EVENT STREAM</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-300 text-[11px] font-medium">
            <Activity size={13} className="text-violet-400" />
            <span>topic: events.de_radar.releases_cdc</span>
          </div>
        </div>

        {/* Botón de Inyección de Tráfico Interactivo con RevealButton */}
        <RevealButton
          onClick={handleTriggerSpike}
          disabled={isSpiking}
          size="sm"
          hideArrow
          className="text-[11px] font-mono py-1 px-3 shadow-[0_0_20px_rgba(255,255,255,0.12)]"
        >
          <Zap size={12} className={isSpiking ? 'text-neutral-950 animate-bounce shrink-0' : 'fill-current shrink-0'} />
          <span>{isSpiking ? 'Drenando Backpressure...' : 'Inyectar Spike de Tráfico'}</span>
        </RevealButton>
      </div>

      {/* 2. Barra de Telemetría en Vivo (Throughput, Lag, Latencia y Garantía) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-neutral-800/80 border-b border-neutral-800/80">
        <div className="p-2.5 bg-neutral-950 flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Throughput</span>
          <span className={`text-xs sm:text-sm font-bold font-mono transition-colors ${isSpiking ? 'text-fuchsia-400' : 'text-violet-400'}`}>
            ~{throughput.toLocaleString()} msg/s
          </span>
          <span className="text-[9px] text-neutral-500">Eventos continuos</span>
        </div>

        <div className="p-2.5 bg-neutral-950 flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Consumer Lag</span>
          <span className={`text-xs sm:text-sm font-bold font-mono flex items-center gap-1 transition-colors ${
            consumerLag > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
          }`}>
            {consumerLag > 0 ? `+${consumerLag} msgs` : '0 msgs (Real-Time)'}
          </span>
          <span className="text-[9px] text-neutral-500">
            {consumerLag > 0 ? 'Buffer acumulado' : 'Consumo al día (SLA)'}
          </span>
        </div>

        <div className="p-2.5 bg-neutral-950 flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Latencia p99</span>
          <span className="text-xs sm:text-sm font-bold text-neutral-200 font-mono">
            {isSpiking ? '38ms' : '18ms'}
          </span>
          <span className="text-[9px] text-neutral-500">End-to-End buffer</span>
        </div>

        <div className="p-2.5 bg-neutral-950 flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Semántica</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono flex items-center gap-1">
            <ShieldCheck size={13} />
            At-Least-Once
          </span>
          <span className="text-[9px] text-neutral-500">Sink Idempotente</span>
        </div>
      </div>

      {/* 3. Radar de Particiones de Kafka en Paralelo (El Diferenciador de Streaming) */}
      <div className="p-3 sm:p-4 bg-neutral-950/90 border-b border-neutral-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
            <Layers size={12} className="text-violet-400" />
            Topología de Particiones & Consumer Group (de-radar-worker)
          </span>
          <span className="text-[10px] text-violet-400 font-mono font-medium">
            Particionamiento por Clave: hash(tool_slug)
          </span>
        </div>

        {/* Las 3 Particiones en Paralelo */}
        <div className="space-y-2">
          {[
            { id: 0, range: 'duckdb, trino', offset: '48,291', rate: '480 msg/s' },
            { id: 1, range: 'airflow, spark', offset: '51,102', rate: '530 msg/s' },
            { id: 2, range: 'dbt, kafka, fivetran', offset: '49,840', rate: '410 msg/s' }
          ].map(p => (
            <div
              key={p.id}
              className="p-2 sm:p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/40 grid grid-cols-[80px_1fr_120px] sm:grid-cols-[110px_1fr_160px] gap-2 items-center text-[10px]"
            >
              {/* Identificador de Partición */}
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="font-bold text-neutral-200">Partition {p.id}</span>
              </div>

              {/* Canal de Flujo de Eventos (Simulación de paquetes pasando) */}
              <div className="relative h-5 rounded-md bg-black/60 border border-neutral-800/70 overflow-hidden flex items-center px-2">
                <div
                  className={`absolute inset-y-0 left-0 bg-violet-500/10 transition-all ${
                    isSpiking ? 'w-full duration-300' : 'w-2/3 duration-1000'
                  }`}
                />
                <div className="relative z-10 flex items-center gap-3 text-[9px] text-neutral-400 truncate font-mono">
                  <span className="text-violet-300">keys: [{p.range}]</span>
                  <span className="text-neutral-600 hidden md:inline">➔</span>
                  <span className="text-neutral-400 hidden md:inline">offset: {p.offset}</span>
                </div>

                {/* Pulso de paquetes viajando */}
                <div className="absolute right-2 size-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>

              {/* Estado del Consumidor */}
              <div className="text-right font-mono">
                <span className="text-emerald-400 font-semibold">{p.rate}</span>
                <span className="text-neutral-500 text-[9px] block">Lag: 0</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Event Ticker (Lo mejor de la Opción 2: Eventos en tiempo real con milisegundos) */}
      <div className="px-3 py-2 bg-black/80 border-b border-neutral-800/80 flex items-center justify-between gap-2 overflow-x-auto text-[10px] text-neutral-400">
        <div className="flex items-center gap-1.5 shrink-0 text-violet-400 font-bold">
          <Terminal size={11} />
          <span>LIVE EVENT TICKER:</span>
        </div>
        <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap font-mono">
          {events.map((ev, i) => (
            <span key={ev.id} className={`shrink-0 ${i === 0 ? 'text-emerald-300 font-semibold' : 'text-neutral-400'}`}>
              [{ev.ts}] P{ev.partition} <strong className="text-neutral-200 font-normal">{ev.tool}</strong> ({ev.latencyMs}ms)
            </span>
          ))}
        </div>
      </div>

      {/* 5. Selector de Pestañas y Panel Técnico Panorámico (3 Columnas) */}
      <div className="p-3 sm:p-4 bg-neutral-950/95 flex flex-col gap-3">
        {/* Selector de Pestaña */}
        <div className="flex border-b border-neutral-800 pb-2 gap-2 text-[11px] font-mono">
          <button
            onClick={() => setActiveTab('windows')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'windows'
                ? 'bg-violet-950/70 text-violet-300 border border-violet-700/60 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clock size={12} className={activeTab === 'windows' ? 'text-violet-400' : 'text-neutral-500'} />
            <span>Ventanas & Watermarks (Opción 2)</span>
          </button>

          <button
            onClick={() => setActiveTab('topology')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'topology'
                ? 'bg-violet-950/70 text-violet-300 border border-violet-700/60 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Workflow size={12} className={activeTab === 'topology' ? 'text-violet-400' : 'text-neutral-500'} />
            <span>Topología & State Backend (Opción 3)</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'bg-violet-950/70 text-violet-300 border border-violet-700/60 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu size={12} className={activeTab === 'code' ? 'text-violet-400' : 'text-neutral-500'} />
            <span>Consumidor Idempotente</span>
          </button>
        </div>

        {/* Paneles Panorámicos en 3 Columnas según Pestaña */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_1.2fr] gap-3 text-[11px]">
          
          {/* Columna 1: Decisión Técnica y Regla */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                // Regla de Oro en Streaming
              </span>
              <p className="text-neutral-300 font-sans leading-relaxed text-xs">
                {activeTab === 'windows'
                  ? 'Event Time vs Processing Time: La marca de agua (Watermark) define cuánto esperar por eventos rezagados en la red. Si el reloj del servidor manda, los datos en tránsito desordenan la analítica.'
                  : activeTab === 'topology'
                  ? 'El particionamiento por hash(tool_slug) garantiza que todos los eventos de la misma herramienta lleguen a la misma partición, garantizando orden estricto sin sincronización global.'
                  : 'Exactly-Once de extremo a extremo es costoso y frágil. La arquitectura estándar de la industria es At-Least-Once en el bus + deduplicación por clave primaria (Upsert) en el Data Warehouse.'}
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
              <span>Tolerancia a eventos tardíos:</span>
              <span className="text-violet-300 font-mono font-semibold">5 segundos (Bounded Out-Of-Orderness)</span>
            </div>
          </div>

          {/* Columna 2: Estado Operativo y Garantías */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between gap-2">
            <div className="space-y-2">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block">
                // Estado del Pipeline
              </span>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">Ventana de Agregación:</span>
                <span className="text-violet-300 font-mono font-semibold">Tumbling 10s</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">State Backend:</span>
                <span className="text-emerald-400 font-mono">RocksDB (In-Memory + SSD)</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">Checkpoint Interval:</span>
                <span className="text-neutral-200 font-mono">500ms (Chandy-Lamport)</span>
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <ShieldCheck size={13} />
              <span>Cero pérdida de estado ante caídas</span>
            </div>
          </div>

          {/* Columna 3: Código Real del Consumidor */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-black/80 font-mono text-[10px] sm:text-[11px] leading-relaxed overflow-x-auto text-neutral-300 flex flex-col justify-between">
            <div className="text-neutral-500 italic mb-1">
              {'# streaming/consumer.py // At-least-once + Commit Manual'}
            </div>
            <pre className="text-cyan-300 whitespace-pre font-mono">
{`async for msg in kafka_consumer:
    # KeyBy garantiza orden por herramienta
    await db.execute(
        "INSERT INTO fct_release_stream ... "
        "ON CONFLICT (tool_slug, version) DO NOTHING",
        msg.value
    )
    # Commit del offset solo tras persistir
    await kafka_consumer.commit()`}
            </pre>
            <div className="mt-2 text-right">
              <span className="text-[9px] text-violet-400 bg-violet-950/80 px-1.5 py-0.5 rounded border border-violet-800">
                At-Least-Once + Idempotent Sink
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
