import { describe, expect, it } from 'vitest';
import { sugerirColecoes } from '../src/dominio/quiz';

const colecoes = [
  { slug: 'essencial', precoAPartirDe: 3200, estilos: ['MINIMALISTA', 'MODERNO'] },
  { slug: 'moderna', precoAPartirDe: 6500, estilos: ['MODERNO', 'MINIMALISTA'] },
  { slug: 'premium', precoAPartirDe: 14000, estilos: ['CLASSICO', 'MODERNO'] },
];

describe('sugerirColecoes (RF09)', () => {
  it('orçamento até 5k sugere apenas a Essencial', () => {
    expect(sugerirColecoes(colecoes, { estilo: 'MODERNO', tamanho: 'ATE_40', orcamento: 'ATE_5K' }).map((c) => c.slug)).toEqual(['essencial']);
  });

  it('orçamento +15k e estilo clássico prioriza a Premium', () => {
    const r = sugerirColecoes(colecoes, { estilo: 'CLASSICO', tamanho: 'ACIMA_80', orcamento: 'ACIMA_15K' });
    expect(r[0]!.slug).toBe('premium');
  });

  it('nunca retorna lista vazia (cai para a mais acessível)', () => {
    const r = sugerirColecoes(colecoes, { estilo: 'CLASSICO', tamanho: 'ATE_40', orcamento: 'ATE_5K' });
    expect(r.length).toBeGreaterThan(0);
  });
});
