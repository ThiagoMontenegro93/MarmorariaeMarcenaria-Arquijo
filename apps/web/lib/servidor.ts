import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_SESSAO, decodificarToken, sessaoValida, type Sessao } from './sessao';

/** Endereço da API visto pelo servidor Next. */
export const API_INTERNA = process.env.API_URL_INTERNA ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function obterSessao(): Promise<{ sessao: Sessao; token: string } | null> {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  const sessao = decodificarToken(token);
  return sessaoValida(sessao) && token ? { sessao, token } : null;
}

/** GET autenticado a partir de Server Components. Sessão inválida → /login. */
export async function apiServidor<T>(caminho: string): Promise<T> {
  const s = await obterSessao();
  if (!s) redirect('/login');
  const r = await fetch(`${API_INTERNA}${caminho}`, { headers: { Authorization: `Bearer ${s.token}` }, cache: 'no-store' });
  if (r.status === 401) redirect('/login?expirou=1');
  if (!r.ok) throw new Error(`Falha ao consultar a API (${r.status}).`);
  return (await r.json()) as T;
}
