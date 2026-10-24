import { describe, expect, it } from 'vitest';
import { decodificarToken, sessaoValida } from '@/lib/sessao';

function token(payload: object): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.assinatura`;
}

describe('decodificarToken', () => {
  it('lê nome, perfil e expiração do payload', () => {
    const s = decodificarToken(token({ sub: 'u1', nome: 'Ana', email: 'a@x.com', perfil: 'GESTOR', exp: 2_000_000_000 }));
    expect(s).toEqual({ id: 'u1', nome: 'Ana', email: 'a@x.com', perfil: 'GESTOR', expiraEm: 2_000_000_000 });
  });

  it('retorna null para token malformado ou perfil desconhecido', () => {
    expect(decodificarToken('abc')).toBeNull();
    expect(decodificarToken(token({ sub: 'u1', perfil: 'HACKER', exp: 1 }))).toBeNull();
    expect(decodificarToken(undefined)).toBeNull();
  });
});

describe('sessaoValida', () => {
  it('considera a expiração', () => {
    const s = { id: 'u', nome: 'A', email: 'a', perfil: 'ADMIN' as const, expiraEm: 1000 };
    expect(sessaoValida(s, 999_000)).toBe(true);
    expect(sessaoValida(s, 1_000_000)).toBe(false);
    expect(sessaoValida(null, 0)).toBe(false);
  });
});
