'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export default function ShareButton() {
  const [copiado, setCopiado] = useState(false)
  const { showToast } = useToast()

  async function compartir() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title })
        return
      } catch {
        // Fallback a clipboard si cancela o falla
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      showToast('Enlace de la ruta copiado al portapapeles')
      setTimeout(() => setCopiado(false), 2200)
    } catch {
      // Ignorar fallo de portapapeles
    }
  }

  return (
    <button
      type="button"
      onClick={compartir}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium border transition-all active:scale-95 ${
        copiado
          ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.15)]'
          : 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white hover:border-neutral-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]'
      }`}
    >
      {copiado ? (
        <>
          <Check size={13} className="text-emerald-400" />
          <span>Enlace copiado</span>
        </>
      ) : (
        <>
          <Share2 size={13} className="text-neutral-400" />
          <span>Compartir ruta</span>
        </>
      )}
    </button>
  )
}
