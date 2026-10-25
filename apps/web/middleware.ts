import { NextResponse, type NextRequest } from 'next/server';
import { podeAcessar, rotaInicial } from './lib/permissoes';
import { COOKIE_SESSAO, decodificarToken, sessaoValida } from './lib/sessao';

/** Protege /app/* (exige sessão e perfil) e tira quem já está logado de /login. */
export function middleware(req: NextRequest) {
  const sessao = decodificarToken(req.cookies.get(COOKIE_SESSAO)?.value);
  const valida = sessaoValida(sessao);
  const { pathname } = req.nextUrl;

  if (pathname === '/login') {
    return valida ? NextResponse.redirect(new URL(rotaInicial(sessao.perfil), req.url)) : NextResponse.next();
  }

  if (!valida) {
    const url = new URL('/login', req.url);
    url.searchParams.set('proximo', pathname);
    const resp = NextResponse.redirect(url);
    resp.cookies.delete(COOKIE_SESSAO);
    return resp;
  }
  if (!podeAcessar(sessao.perfil, pathname)) {
    return NextResponse.redirect(new URL(rotaInicial(sessao.perfil), req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/app', '/app/:path*', '/login'] };
