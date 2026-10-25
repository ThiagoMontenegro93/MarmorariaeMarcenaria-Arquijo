'use client';

import { useEffect } from 'react';

/** Registra o service worker do PWA (medição offline). */
export function RegistrarSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(() => navigator.serviceWorker.ready)
        .then((reg) => {
          // Só a tela de medição precisa abrir offline; enviamos os recursos já carregados.
          if (window.location.pathname !== '/app/medicao') return;
          const urls = performance
            .getEntriesByType('resource')
            .map((r) => r.name)
            .filter((u) => u.includes('/_next/static/'));
          reg.active?.postMessage({ tipo: 'precache', urls: [...urls, '/app/medicao'] });
        })
        .catch(() => undefined);
    }
  }, []);
  return null;
}
