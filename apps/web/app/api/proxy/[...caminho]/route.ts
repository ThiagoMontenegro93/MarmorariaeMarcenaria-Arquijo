import { NextResponse } from 'next/server';
import { origemPermitida } from '@/lib/origem';
import { COOKIE_SESSAO } from '@/lib/sessao';
import { API_INTERNA } from '@/lib/servidor';

/**
 * Proxy autenticado: o navegador chama /api/proxy/<rota da API> e o servidor Next
 * acrescenta o Bearer a partir do cookie httpOnly. O token nunca chega ao JavaScript.
 */
async function encaminhar(req: Request, ctx: { params: Promise<{ caminho: string[] }> }) {
  if (!origemPermitida(req)) return NextResponse.json({ message: 'Origem não permitida.' }, { status: 403 });
  const { caminho } = await ctx.params;
  if (caminho.some((seg) => seg === '..' || seg === '.' || seg.includes('\\'))) {
    return NextResponse.json({ message: 'Caminho inválido.' }, { status: 400 });
  }
  const token = req.headers.get('cookie')?.match(new RegExp(`(?:^|; )${COOKIE_SESSAO}=([^;]+)`))?.[1];
  if (!token) return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });

  const url = new URL(req.url);
  const destino = `${API_INTERNA}/${caminho.map(encodeURIComponent).join('/')}${url.search}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${decodeURIComponent(token)}` };
  const tipo = req.headers.get('content-type');
  if (tipo) headers['Content-Type'] = tipo;

  const temCorpo = !['GET', 'HEAD'].includes(req.method);
  const r = await fetch(destino, {
    method: req.method,
    headers,
    body: temCorpo ? await req.arrayBuffer() : undefined,
    cache: 'no-store',
  }).catch(() => null);
  if (!r) return NextResponse.json({ message: 'API indisponível.' }, { status: 502 });

  const respHeaders = new Headers();
  for (const h of ['content-type', 'content-disposition', 'content-length']) {
    const v = r.headers.get(h);
    if (v) respHeaders.set(h, v);
  }
  const resp = new NextResponse(r.body, { status: r.status, headers: respHeaders });
  if (r.status === 401) resp.cookies.set(COOKIE_SESSAO, '', { path: '/', maxAge: 0 });
  return resp;
}

export const GET = encaminhar;
export const POST = encaminhar;
export const PUT = encaminhar;
export const PATCH = encaminhar;
export const DELETE = encaminhar;
