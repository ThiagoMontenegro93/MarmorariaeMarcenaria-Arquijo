'use client';

import { useRouter } from 'next/navigation';

export function BotaoSair() {
  const router = useRouter();
  async function sair() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }
  return (
    <button type="button" onClick={sair} className="text-xs text-stone-300 underline-offset-2 hover:underline">
      Sair
    </button>
  );
}
