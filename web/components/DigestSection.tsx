'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DigestEntry } from '@/lib/db';
import { GitCommitHorizontal, Newspaper, AlertTriangle } from 'lucide-react';

const customEase = [0.4, 0, 0.2, 1] as const;

const SAMPLE_DIGEST: DigestEntry[] = [
  {
    tool_slug: 'duckdb',
    tool_name: 'DuckDB',
    category: 'query-engine',
    release_count_7d: 1,
    breaking_count_7d: 0,
    releases_7d: [{
      version: 'v1.5.0',
      published_at: new Date().toISOString(),
      has_breaking: false,
      source_url: 'https://github.com/duckdb/duckdb/releases',
    }],
    article_count_7d: 1,
    top_articles_7d: [{
      article_id: 1,
      title: 'DuckDB: Resultados de Consultas por Chunks en el Driver JDBC/Java',
      url: 'https://duckdb.org/2026/08/21/chunked-query-results-java-driver.html',
      summary_en: null,
      summary_es: 'DuckDB introduce el streaming de resultados por chunks para aplicaciones Java y JDBC, reduciendo el consumo de memoria del cliente.',
    }],
  },
];

function DigestCard({ entry }: { entry: DigestEntry }) {
  const totalActivity = entry.release_count_7d + entry.article_count_7d;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: customEase }}
      className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-base">{entry.tool_name}</h3>
        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
          {totalActivity} evento{totalActivity !== 1 ? 's' : ''}
        </span>
      </div>

      {entry.release_count_7d > 0 && (
        <div className="flex items-center gap-2 text-xs text-neutral-300">
          <GitCommitHorizontal size={14} className="text-emerald-400 shrink-0" />
          <span>{entry.release_count_7d} release{entry.release_count_7d > 1 ? 's' : ''}</span>
          {entry.breaking_count_7d > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <AlertTriangle size={12} />
              {entry.breaking_count_7d} con breaking changes
            </span>
          )}
        </div>
      )}

      {entry.article_count_7d > 0 && (
        <div className="flex items-start gap-2 text-xs text-neutral-300">
          <Newspaper size={14} className="text-neutral-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <span>{entry.article_count_7d} artículo{entry.article_count_7d > 1 ? 's' : ''}</span>
            {entry.top_articles_7d.slice(0, 2).map((article) => (
              <div key={article.article_id} className="flex flex-col gap-0.5">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-emerald-400 transition-colors underline decoration-neutral-700 underline-offset-2"
                >
                  {article.title}
                </a>
                {(article.summary_es || article.summary_en) && (
                  <p className="text-neutral-600 text-[11px] leading-relaxed">
                    {article.summary_es || article.summary_en}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function DigestSection({ entries = [] }: { entries?: DigestEntry[] }) {
  const items = entries.length > 0 ? entries : SAMPLE_DIGEST;

  return (
    <section id="digest" className="w-full max-w-7xl mx-auto px-5 sm:px-6 py-16 sm:py-20 lg:py-28 relative scroll-mt-28">
      <div className="flex flex-col gap-3 mb-10">
        <p className="font-mono text-xs tracking-widest text-emerald-400 font-semibold uppercase">
          [04] // DIGEST SEMANAL
        </p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-[1.1]">
          Lo que pasó esta semana
        </h2>
        <p className="max-w-xl text-sm sm:text-base text-neutral-400 font-light leading-relaxed">
          Actividad de los últimos 7 días en el ecosistema: releases, breaking changes y artículos curados.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-neutral-500 text-sm">Sin actividad registrada en los últimos 7 días.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((entry) => (
            <DigestCard key={entry.tool_slug} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
