import { NextResponse } from 'next/server';
import { origemPermitida } from '@/lib/origem';
import { rotaInicial } from '@/lib/permissoes';
import { COOKIE_SESSAO, decodificarToken } from '@/lib/sessao';
import { API_INTERNA } from '@/lib/servidor';

/** Faz login na API e guarda o JWT num cookie httpOnly (nunca exposto ao JavaScript do navegador). */
export async function POST(req: Request) {
  if (!origemPermitida(req)) return NextResponse.json({ message: 'Origem não permitida.' }, { status: 403 });
  const corpo = (await req.json().catch(() => null)) as { email?: string; senha?: string } | null;
  if (!corpo?.email || !corpo?.senha) return NextResponse.json({ message: 'Informe e-mail e senha.' }, { status: 400 });

  const r = await fetch(`${API_INTERNA}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': req.headers.get('x-forwarded-for') ?? '' },
    body: JSON.stringify({ email: corpo.email, senha: corpo.senha }),
    cache: 'no-store',
  }).catch(() => null);
  if (!r) return NextResponse.json({ message: 'API indisponível. Tente novamente.' }, { status: 502 });
  const dados = (await r.json().catch(() => ({}))) as { accessToken?: string; message?: string | string[] };
  if (!r.ok || !dados.accessToken) {
    const message = Array.isArray(dados.message) ? dados.message.join(' ') : (dados.message ?? 'Não foi possível entrar.');
    return NextResponse.json({ message }, { status: r.status === 429 ? 429 : 401 });
  }

  const sessao = decodificarToken(dados.accessToken);
  if (!sessao) return NextResponse.json({ message: 'Token inválido.' }, { status: 502 });

  const resp = NextResponse.json({ usuario: { nome: sessao.nome, perfil: sessao.perfil }, destino: rotaInicial(sessao.perfil) });
  resp.cookies.set(COOKIE_SESSAO, dados.accessToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.max(0, sessao.expiraEm - Math.floor(Date.now() / 1000)),
  });
  return resp;
}
