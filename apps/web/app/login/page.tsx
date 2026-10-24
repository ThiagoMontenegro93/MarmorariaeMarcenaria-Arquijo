import type { Metadata } from 'next';
import { FormLogin } from './FormLogin';

export const metadata: Metadata = { title: 'Entrar' };

export default async function Login({ searchParams }: { searchParams: Promise<{ proximo?: string; expirou?: string }> }) {
  const { proximo, expirou } = await searchParams;
  // Só aceita redirecionar para dentro de /app (evita open redirect).
  const destino = proximo && /^\/app(\/|$)/.test(proximo) ? proximo : undefined;
  return (
    <div className="flex min-h-screen items-center justify-center bg-fundo px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-display text-3xl font-semibold text-marca-escura">Arquijo</p>
          <p className="text-sm text-stone-500">Marmoraria e Marcenaria · Sistema interno</p>
        </div>
        {expirou && <p className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">Sua sessão expirou. Entre novamente.</p>}
        <FormLogin destino={destino} />
      </div>
    </div>
  );
}
