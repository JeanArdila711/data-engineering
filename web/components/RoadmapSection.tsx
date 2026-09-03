import type { RoadmapNode } from '@/lib/roadmap'

const NIVELES: Record<number, string> = {
  0: 'Base', 1: 'Modelo mental', 2: 'Ingesta', 3: 'Almacenamiento',
  4: 'Almacenamiento analítico', 5: 'Transformación y modelado',
  6: 'Orquestación', 7: 'Streaming', 8: 'Garantías de entrega',
  9: 'Procesamiento distribuido', 10: 'Nube', 11: 'Transversales',
}

function Implementacion({ impl }: { impl: RoadmapNode['implementaciones'][number] }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
      <span className="font-mono text-neutral-200">{impl.nombre}</span>
      {impl.proveedor && (
        <span className="text-[11px] uppercase tracking-wide text-neutral-500">{impl.proveedor}</span>
      )}
      {impl.last_version && (
        <span className="font-mono text-[11px] text-emerald-400">v{impl.last_version}</span>
      )}
      {/* La nota nunca se esconde tras un hover: una equivalencia sin su
          salvedad visible es la tabla de tres columnas que miente. */}
      {impl.equivalencia && impl.equivalencia !== 'alta' && impl.nota && (
        <span className="w-full text-[12px] leading-snug text-amber-300/80">
          Equivalencia {impl.equivalencia}: {impl.nota}
        </span>
      )}
    </li>
  )
}

function Nodo({ node, nota }: { node: RoadmapNode; nota?: string }) {
  return (
    <article className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-5 transition-shadow hover:shadow-[0_0_28px_rgba(16,185,129,0.10)]">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-semibold text-neutral-100">{node.nombre}</h3>
        <span className="shrink-0 text-[11px] uppercase tracking-wide text-neutral-500">{node.tipo}</span>
      </header>

      {nota && <p className="mb-3 text-xs text-neutral-500">{nota}</p>}

      <p className="mb-4 text-sm leading-relaxed text-neutral-300">{node.resuelve}</p>

      <p className="mb-4 border-l-2 border-emerald-600/60 pl-3 text-sm text-neutral-300">
        <span className="mb-1 block text-[11px] uppercase tracking-wide text-emerald-500">Lo dominás cuando</span>
        {node.dominado_cuando}
      </p>

      {node.experiencia_texto ? (
        <div className="mb-4 rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-amber-500">Lo vi romperse</span>
          <p className="text-sm leading-relaxed text-neutral-300">{node.experiencia_texto}</p>
          {node.experiencia_link && (
            <a href={node.experiencia_link} className="mt-2 inline-block text-[12px] text-amber-400 underline">
              Ver el caso
            </a>
          )}
        </div>
      ) : (
        // El vacío se muestra, no se tapa: inventar el bloque sería peor que
        // no tenerlo (decisión 5 de Ruta DE).
        <p className="mb-4 rounded-lg border border-dashed border-neutral-800 p-3 text-[13px] text-neutral-500">
          Todavía no lo practiqué — cuando lo haga, acá va lo que se rompió.
        </p>
      )}

      {node.implementaciones.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {node.implementaciones.map(impl => (
            <Implementacion key={impl.nombre} impl={impl} />
          ))}
        </ul>
      )}

      <ul className="space-y-1">
        {node.fuentes.map(f => (
          <li key={f.url} className="text-[12px] text-neutral-500">
            <a href={f.url} className="text-neutral-400 underline underline-offset-2">{f.url}</a>
            {' — '}{f.por_que}
          </li>
        ))}
      </ul>
    </article>
  )
}

export default function RoadmapSection({
  grupos,
  notas = {},
  encabezado = true,
}: {
  grupos: { nivel: number; nodes: RoadmapNode[] }[]
  notas?: Record<string, string>
  encabezado?: boolean
}) {
  return (
    <section id="rumbo" className="mx-auto max-w-5xl px-4 py-16">
      {encabezado && (
        <>
          <h1 className="mb-2 text-3xl font-semibold text-neutral-100">Rumbo</h1>
          <p className="mb-12 max-w-2xl text-neutral-400">
            El concepto es el nodo; las herramientas son formas de practicarlo. Los datos de
            cada herramienta salen del mismo pipeline que alimenta el resto del sitio.
          </p>
        </>
      )}

      {grupos.map(({ nivel, nodes }) => (
        <div key={nivel} className="mb-14">
          <h2 className="mb-5 text-sm uppercase tracking-widest text-neutral-500">
            {NIVELES[nivel] ?? `Nivel ${nivel}`}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {nodes.map(node => (
              <Nodo key={node.slug} node={node} nota={notas[node.slug]} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
