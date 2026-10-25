'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export function FormLogin({ destino }: { destino?: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.get('email'), senha: f.get('senha') }),
      });
      const dados = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(dados.message ?? 'Não foi possível entrar.');
      router.replace(destino ?? dados.destino ?? '/app/os');
      router.refresh();
    } catch (err) {
      setErro((err as Error).message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="cartao space-y-4 p-6">
      <label className="block">
        <span className="rotulo">E-mail</span>
        <input name="email" type="email" required autoComplete="username" className="campo mt-1" />
      </label>
      <label className="block">
        <span className="rotulo">Senha</span>
        <input name="senha" type="password" required minLength={8} autoComplete="current-password" className="campo mt-1" />
      </label>
      {erro && (
        <p role="alert" className="text-sm text-red-700">
          {erro}
        </p>
      )}
      <button type="submit" disabled={enviando} className="botao w-full">
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
