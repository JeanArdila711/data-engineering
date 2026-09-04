'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { parsearGuardados } from './roadmap'

const CLAVE = 'rumbo.sabidos'
const EVENTO = 'rumbo:sabidos'

function suscribir(cb: () => void) {
  window.addEventListener('storage', cb)
  window.addEventListener(EVENTO, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(EVENTO, cb)
  }
}

// El snapshot es el string crudo: useSyncExternalStore exige un valor estable
// entre lecturas, y un array nuevo por lectura haría un bucle de render.
function snapshot(): string {
  try {
    return localStorage.getItem(CLAVE) ?? ''
  } catch {
    return ''
  }
}

/**
 * Lo marcado como sabido, persistido en este navegador (D4 del plan de Fase 4).
 * En el servidor y hasta montar, `guardados` es []: el HTML estático no cambia.
 * Sin localStorage (privado, bloqueado, lanza), todo sigue funcionando sin guardar.
 */
export function useSabidosGuardados() {
  const raw = useSyncExternalStore(suscribir, snapshot, () => '')
  const guardados = useMemo(() => parsearGuardados(raw), [raw])

  const guardar = useCallback((slugs: string[]) => {
    try {
      if (slugs.length === 0) localStorage.removeItem(CLAVE)
      else localStorage.setItem(CLAVE, JSON.stringify(slugs))
    } catch {
      // sin storage: la Fase 3 sigue igual, solo no se recuerda
    }
    window.dispatchEvent(new Event(EVENTO))
  }, [])

  const limpiar = useCallback(() => guardar([]), [guardar])
  return { guardados, guardar, limpiar }
}
