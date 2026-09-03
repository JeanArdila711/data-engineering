import type { WizardOption } from '@/lib/roadmap'

function Grupo({ titulo, name, opciones }: { titulo: string; name: string; opciones: WizardOption[] }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-3 text-sm font-mono uppercase tracking-widest text-neutral-400">{titulo}</legend>
      {opciones.map((o, i) => (
        <label
          key={o.slug}
          className="flex cursor-pointer gap-3 rounded-xl border border-neutral-800 p-4 has-[:checked]:border-emerald-400"
        >
          <input type="radio" name={name} value={o.slug} defaultChecked={i === 0} required className="mt-1 accent-emerald-400" />
          <span>
            <span className="block text-white">{o.nombre}</span>
            <span className="block text-sm text-neutral-400">{o.descripcion.trim()}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}

export default function RoadmapWizard({ opciones }: { opciones: WizardOption[] }) {
  const objetivos = opciones.filter(o => o.kind === 'objetivo')
  const partidas = opciones.filter(o => o.kind === 'partida')
  if (objetivos.length === 0 || partidas.length === 0) return null

  return (
    <section id="armar" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-12">
      <h2 className="text-2xl font-semibold text-white">Armá tu rumbo</h2>
      <p className="mt-2 text-neutral-400">
        Dos preguntas. La ruta sale del grafo, no de una plantilla: mismas respuestas, misma ruta.
      </p>
      <form action="/ruta/ir" method="get" className="mt-8 grid gap-8 md:grid-cols-2">
        <Grupo titulo="¿Hasta dónde querés llegar?" name="objetivo" opciones={objetivos} />
        <Grupo titulo="¿De dónde arrancás?" name="partida" opciones={partidas} />
        <button
          type="submit"
          className="md:col-span-2 justify-self-start rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black"
        >
          Ver mi ruta
        </button>
      </form>
    </section>
  )
}
