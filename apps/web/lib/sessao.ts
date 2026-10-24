import { PERFIS, type Perfil } from './tipos-perfil';

/** Nome do cookie httpOnly com o JWT da API. */
export const COOKIE_SESSAO = 'arquijo_sessao';

export interface Sessao {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  /** Expiração em segundos desde epoch (claim `exp`). */
  expiraEm: number;
}

/**
 * Lê o payload do JWT (sem verificar assinatura) para montar a interface:
 * nome, perfil e expiração. A API continua sendo quem VALIDA o token em cada chamada.
 * Usa atob (disponível no Edge runtime do middleware e no Node 18+).
 */
export function decodificarToken(token: string | undefined | null): Sessao | null {
  if (!token) return null;
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  try {
    const b64 = partes[1]!.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '='))
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    const p = JSON.parse(json) as Record<string, unknown>;
    if (typeof p.sub !== 'string' || typeof p.exp !== 'number' || !PERFIS.includes(p.perfil as Perfil)) return null;
    return {
      id: p.sub,
      nome: typeof p.nome === 'string' ? p.nome : '',
      email: typeof p.email === 'string' ? p.email : '',
      perfil: p.perfil as Perfil,
      expiraEm: p.exp,
    };
  } catch {
    return null;
  }
}

export function sessaoValida(s: Sessao | null, agoraMs: number = Date.now()): s is Sessao {
  return !!s && s.expiraEm * 1000 > agoraMs;
}
