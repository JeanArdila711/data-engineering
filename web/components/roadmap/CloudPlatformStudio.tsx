'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RevealButton } from '@/components/ui/reveal-button';
import {
  Cloud,
  Layers,
  Database,
  ShieldCheck,
  Zap,
  TrendingDown,
  AlertOctagon,
  FileCode2,
  Server,
  Lock,
  ArrowRight,
  Sparkles,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function CloudPlatformStudio() {
  const [isFinOpsOptimized, setIsFinOpsOptimized] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'finops' | 'storage' | 'iac'>('finops');

  return (
    <div className="rounded-2xl border border-neutral-800/90 bg-neutral-950/95 shadow-2xl overflow-hidden font-mono text-xs flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.6)]">
      
      {/* 1. Header de Consola de Infraestructura Cloud (Estilo AWS / Terraform) */}
      <div className="px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-950/60 border border-sky-700/50 text-sky-400 text-[10px] font-bold">
            <Cloud size={11} className="text-sky-400" />
            <span>TERRAFORM CLOUD RACK</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-300 text-[11px] font-medium">
            <Server size={13} className="text-sky-400" />
            <span>stack: de_radar_platform_us_east_1</span>
          </div>
        </div>

        {/* Botón de Toggle FinOps Interactivo con RevealButton */}
        <RevealButton
          onClick={() => setIsFinOpsOptimized(!isFinOpsOptimized)}
          size="sm"
          hideArrow
          className="text-[11px] font-mono py-1 px-3 shadow-[0_0_20px_rgba(255,255,255,0.12)]"
        >
          {isFinOpsOptimized ? (
            <>
              <TrendingDown size={12} className="stroke-[2.5] shrink-0" />
              <span>Modo FinOps: Optimizado ($0/mes)</span>
            </>
          ) : (
            <>
              <AlertOctagon size={12} className="stroke-[2.5] shrink-0" />
              <span>Modo Naive: Desperdicio ($142/mes)</span>
            </>
          )}
        </RevealButton>
      </div>

      {/* 2. Barra de Telemetría FinOps en Vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-neutral-800/80 border-b border-neutral-800/80">
        <div className="p-2.5 bg-neutral-950 flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Costo Mensual Estimado</span>
          <span className={`text-xs sm:text-sm font-bold font-mono transition-colors ${
            isFinOpsOptimized ? 'text-emerald-400' : 'text-rose-400 animate-pulse'
          }`}>
            {isFinOpsOptimized ? '$0.00 / mes' : '$142.50 / mes'}
          </span>
          <span className="text-[9px] text-neutral-500">
            {isFinOpsOptimized ? '100% Free Tier S3+Neon' : 'Servidores 24/7 sin sleep'}
          </span>
        </div>

        <div className="p-2.5 bg-neutral-950 flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Datos Escaneados / Query</span>
          <span className={`text-xs sm:text-sm font-bold font-mono transition-colors ${
            isFinOpsOptimized ? 'text-sky-400' : 'text-amber-400'
          }`}>
            {isFinOpsOptimized ? '1.2 MB' : '82.4 GB'}
          </span>
          <span className="text-[9px] text-neutral-500">
            {isFinOpsOptimized ? 'Poda de particiones activa' : 'Full Table Scan crudo'}
          </span>
        </div>

        <div className="p-2.5 bg-neutral-950 flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Archivos en S3</span>
          <span className="text-xs sm:text-sm font-bold text-neutral-200 font-mono">
            {isFinOpsOptimized ? '12 Parquets (128MB)' : '10,000 JSONs (4KB)'}
          </span>
          <span className="text-[9px] text-neutral-500">
            {isFinOpsOptimized ? 'Compactados sin overhead' : 'Small Files Problem'}
          </span>
        </div>

        <div className="p-2.5 bg-neutral-950 flex flex-col gap-0.5">
          <span className="text-[10px] text-neutral-500 uppercase">Seguridad IAM</span>
          <span className={`text-xs sm:text-sm font-bold font-mono flex items-center gap-1 ${
            isFinOpsOptimized ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            <ShieldCheck size={13} />
            {isFinOpsOptimized ? 'OIDC Sin Secretos' : 'Keys Estáticas'}
          </span>
          <span className="text-[9px] text-neutral-500">
            {isFinOpsOptimized ? 'GitHub Actions STS role' : 'Riesgo de fuga en git'}
          </span>
        </div>
      </div>

      {/* 3. Rack de Arquitectura Multi-Capa en 3 Módulos Panorámicos */}
      <div className="p-3 sm:p-4 bg-neutral-950/90 border-b border-neutral-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
            <Layers size={12} className="text-sky-400" />
            Topología de Infraestructura en Nube (Multi-Tier)
          </span>
          <span className="text-[10px] text-sky-400 font-mono font-medium">
            {isFinOpsOptimized ? 'Arquitectura Efímera Serverless' : 'Arquitectura Monolítica Always-On'}
          </span>
        </div>

        {/* Los 3 Módulos de Infraestructura del Rack */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Módulo 1: Storage Layer & Tiering (De Opción 2) */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300 text-[11px] flex items-center gap-1.5">
                <Database size={12} className="text-sky-400" />
                1. Storage & Tiering
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-950/70 text-sky-300 border border-sky-800 font-mono">
                AWS S3
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[10px] text-neutral-300 bg-black/60 p-2.5 rounded-lg border border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-500">Hot (0-30d):</span>
                <span className="text-sky-300 font-semibold">S3 Standard ($0.023/GB)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Warm (31-90d):</span>
                <span className="text-amber-300 font-semibold">S3-IA ($0.0125/GB)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Cold (+90d):</span>
                <span className="text-emerald-300 font-semibold">Glacier Instant ($0.004/GB)</span>
              </div>
            </div>

            <div className="text-[10px] text-neutral-400 font-sans leading-snug">
              {isFinOpsOptimized
                ? 'Lifecycle rules mueven datos viejos automáticamente a Glacier, reduciendo 82% el costo de storage histórico.'
                : 'Todo se guarda en S3 Standard indefinidamente, acumulando costos de almacenamiento sin necesidad.'}
            </div>
          </div>

          {/* Módulo 2: Compute & Query Engine (Serverless vs Always-on) */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300 text-[11px] flex items-center gap-1.5">
                <Zap size={12} className="text-sky-400" />
                2. Compute & Query Engine
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                isFinOpsOptimized ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800' : 'bg-rose-950/70 text-rose-300 border-rose-800'
              }`}>
                {isFinOpsOptimized ? 'SERVERLESS' : 'EC2 24/7'}
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[10px] text-neutral-300 bg-black/60 p-2.5 rounded-lg border border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-500">Motor de Cómputo:</span>
                <span className="text-neutral-200">{isFinOpsOptimized ? 'DuckDB Ephemeral' : 'Cluster EC2 t3.large'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Inactividad:</span>
                <span className="text-emerald-400 font-semibold">{isFinOpsOptimized ? 'Auto-Sleep (0€)' : 'Cobro Activo 24/7'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Costo Cómputo:</span>
                <span className={isFinOpsOptimized ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {isFinOpsOptimized ? '$0.00 / mes' : '$104.20 / mes'}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-neutral-400 font-sans leading-snug">
              {isFinOpsOptimized
                ? 'El cómputo se levanta solo durante la ejecución del pipeline y se destruye al terminar. Cero facturación ociosa.'
                : 'Instancia encendida de noche y fines de semana esperando queries que nunca llegan.'}
            </div>
          </div>

          {/* Módulo 3: Gobernanza, IAM & OIDC (De Opción 3) */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300 text-[11px] flex items-center gap-1.5">
                <Lock size={12} className="text-sky-400" />
                3. Seguridad & Zero-Trust
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
                AWS IAM
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[10px] text-neutral-300 bg-black/60 p-2.5 rounded-lg border border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-500">Método Auth:</span>
                <span className="text-sky-300 font-semibold">{isFinOpsOptimized ? 'OIDC WebIdentity' : 'Access Key ID'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Vigencia Token:</span>
                <span className="text-emerald-400">{isFinOpsOptimized ? '15 min (Efímero)' : 'Permanente (Inseguro)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Secretos en Repo:</span>
                <span className="text-emerald-400 font-bold">{isFinOpsOptimized ? '0 Secretos' : '1 Clave en CI'}</span>
              </div>
            </div>

            <div className="text-[10px] text-neutral-400 font-sans leading-snug">
              {isFinOpsOptimized
                ? 'GitHub Actions asume un rol de AWS temporal vía token criptográfico OIDC. Si un atacante roba el repo, no hay claves que filtrar.'
                : 'Claves de larga duración en variables de entorno con riesgo de compromiso y cargos astronómicos no autorizados.'}
            </div>
          </div>

        </div>
      </div>

      {/* 4. Selector de Pestañas y Panel Técnico Panorámico (3 Columnas) */}
      <div className="p-3 sm:p-4 bg-neutral-950/95 flex flex-col gap-3">
        {/* Selector de Pestaña */}
        <div className="flex border-b border-neutral-800 pb-2 gap-2 text-[11px] font-mono">
          <button
            onClick={() => setActiveTab('finops')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'finops'
                ? 'bg-sky-950/70 text-sky-300 border border-sky-700/60 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <DollarSign size={12} className={activeTab === 'finops' ? 'text-sky-400' : 'text-neutral-500'} />
            <span>Reglas FinOps de Oro</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'storage'
                ? 'bg-sky-950/70 text-sky-300 border border-sky-700/60 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database size={12} className={activeTab === 'storage' ? 'text-sky-400' : 'text-neutral-500'} />
            <span>Small Files & Compactación</span>
          </button>

          <button
            onClick={() => setActiveTab('iac')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'iac'
                ? 'bg-sky-950/70 text-sky-300 border border-sky-700/60 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode2 size={12} className={activeTab === 'iac' ? 'text-sky-400' : 'text-neutral-500'} />
            <span>Terraform IaC (s3_lifecycle.tf)</span>
          </button>
        </div>

        {/* Paneles Panorámicos en 3 Columnas según Pestaña */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_1.2fr] gap-3 text-[11px]">
          
          {/* Columna 1: Decisión Técnica y Regla */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                {'// Decisión de Arquitectura'}
              </span>
              <p className="text-neutral-300 font-sans leading-relaxed text-xs">
                {activeTab === 'finops'
                  ? 'El costo del cómputo en la nube siempre supera al almacenamiento por un orden de magnitud. Particionar por fecha y podar particiones (Partition Pruning) reduce los bytes escaneados en 99%, salvando la factura mensual.'
                  : activeTab === 'storage'
                  ? 'Tener 10,000 JSONs de 4KB provoca saturación de peticiones GET en S3 ($0.0004 por 1,000) y tiempos de latencia inaceptables en Athena/DuckDB. Compactar a Parquet columnar acelera las consultas 15x.'
                  : 'Infraestructura inmutable como código: ningún recurso se crea manualmente en la consola web de AWS. Todo cambio de configuración queda versionado en Git con plan de ejecución pre-aprobado.'}
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
              <span>Ahorro proyectado anual:</span>
              <span className="text-emerald-400 font-mono font-semibold">~$1,710 USD / año</span>
            </div>
          </div>

          {/* Columna 2: Estado Operativo y Garantías */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between gap-2">
            <div className="space-y-2">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block">
                {'// Garantía de Operación'}
              </span>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">Poda de Partición:</span>
                <span className="text-sky-300 font-mono font-semibold">year / month / day</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">Formato Columnar:</span>
                <span className="text-emerald-400 font-mono">Parquet (Snappy / ZSTD)</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">IAM Trust Policy:</span>
                <span className="text-emerald-400 font-mono">AssumeRoleWithWebIdentity</span>
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <ShieldCheck size={13} />
              <span>Infraestructura 100% Vendor-Agnostic</span>
            </div>
          </div>

          {/* Columna 3: Código Terraform / IaC Real */}
          <div className="p-3 rounded-xl border border-neutral-800 bg-black/80 font-mono text-[10px] sm:text-[11px] leading-relaxed overflow-x-auto text-neutral-300 flex flex-col justify-between">
            <div className="text-neutral-500 italic mb-1">
              {'# terraform/s3_lifecycle.tf // Reglas de Ciclo de Vida'}
            </div>
            <pre className="text-cyan-300 whitespace-pre font-mono">
{`resource "aws_s3_bucket_lifecycle_configuration" "lake" {
  bucket = aws_s3_bucket.data_lake.id

  rule {
    id     = "archive-cold-data"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER_IR"
    }
  }
}`}
            </pre>
            <div className="mt-2 text-right">
              <span className="text-[9px] text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800">
                Terraform 1.9 // OpenTofu Ready
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
