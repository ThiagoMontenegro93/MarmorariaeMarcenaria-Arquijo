import { NextResponse } from 'next/server';
import { origemPermitida } from '@/lib/origem';
import { COOKIE_SESSAO } from '@/lib/sessao';

export async function POST(req: Request) {
  if (!origemPermitida(req)) return NextResponse.json({ message: 'Origem não permitida.' }, { status: 403 });
  const resp = NextResponse.json({ ok: true });
  resp.cookies.set(COOKIE_SESSAO, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return resp;
}
