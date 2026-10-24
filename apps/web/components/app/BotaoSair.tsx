'use client';

import { useRouter } from 'next/navigation';

export function BotaoSair() {
  const router = useRouter();
  async function sair() {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Limpa caches locais (lista de OS e páginas); medições pendentes são preservadas.
    await import('@/lib/idb-medicoes').then((m) => m.limparCache()).catch(() => undefined);
    navigator.serviceWorker?.controller?.postMessage('limpar-cache');
    router.replace('/login');
    router.refresh();
  }
  return (
    <button type="button" onClick={sair} className="text-xs text-stone-300 underline-offset-2 hover:underline">
      Sair
    </button>
  );
}
