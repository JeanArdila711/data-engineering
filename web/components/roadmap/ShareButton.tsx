'use client'

import { useState } from 'react'

export default function ShareButton() {
  const [copiado, setCopiado] = useState(false)

  async function compartir() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ url, title: document.title }).catch(() => {})
      return
    }
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={compartir}
      className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black"
    >
      {copiado ? 'Link copiado' : 'Compartir esta ruta'}
    </button>
  )
}
