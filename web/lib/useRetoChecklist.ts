'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

function parsearChecklist(raw: string, validSet: Set<string>): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v)
      ? v.filter((s): s is string => typeof s === 'string' && validSet.has(s))
      : [];
  } catch {
    return [];
  }
}

export function useRetoChecklist(objetivoSlug: string, validSlugs: string[]) {
  const clave = `de_radar_reto_${objetivoSlug}_checklist`;
  const evento = `de_radar_reto_${objetivoSlug}:change`;
  const validSet = useMemo(() => new Set(validSlugs), [validSlugs]);

  const suscribir = useCallback(
    (cb: () => void) => {
      window.addEventListener('storage', cb);
      window.addEventListener(evento, cb);
      return () => {
        window.removeEventListener('storage', cb);
        window.removeEventListener(evento, cb);
      };
    },
    [evento]
  );

  const snapshot = useCallback((): string => {
    try {
      return localStorage.getItem(clave) ?? '';
    } catch {
      return '';
    }
  }, [clave]);

  const raw = useSyncExternalStore(suscribir, snapshot, () => '');
  const checkedSlugs = useMemo(() => parsearChecklist(raw, validSet), [raw, validSet]);

  const toggle = useCallback(
    (slug: string) => {
      let next: string[];
      if (checkedSlugs.includes(slug)) {
        next = checkedSlugs.filter((s) => s !== slug);
      } else {
        next = [...checkedSlugs, slug];
      }
      try {
        if (next.length === 0) localStorage.removeItem(clave);
        else localStorage.setItem(clave, JSON.stringify(next));
      } catch {
        // sin storage
      }
      window.dispatchEvent(new Event(evento));
    },
    [checkedSlugs, clave, evento]
  );

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(clave);
    } catch {
      // sin storage
    }
    window.dispatchEvent(new Event(evento));
  }, [clave, evento]);

  return { checkedSlugs, toggle, reset };
}
