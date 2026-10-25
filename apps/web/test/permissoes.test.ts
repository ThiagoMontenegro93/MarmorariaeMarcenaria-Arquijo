import { describe, expect, it } from 'vitest';
import { menuPara, podeAcessar, rotaInicial } from '@/lib/permissoes';

describe('podeAcessar (espelha os guards da API)', () => {
  it('ADMIN acessa tudo', () => {
    for (const r of ['/app', '/app/os', '/app/projetos/1', '/app/chapas', '/app/leads', '/app/medicao']) {
      expect(podeAcessar('ADMIN', r)).toBe(true);
    }
  });

  it('dashboard só para GESTOR', () => {
    expect(podeAcessar('GESTOR', '/app')).toBe(true);
    expect(podeAcessar('COMERCIAL', '/app')).toBe(false);
    expect(podeAcessar('MARCENEIRO', '/app')).toBe(false);
  });

  it('leads B2B: GESTOR e COMERCIAL; marceneiro não', () => {
    expect(podeAcessar('COMERCIAL', '/app/leads')).toBe(true);
    expect(podeAcessar('MARCENEIRO', '/app/leads')).toBe(false);
  });

  it('OS, chapas e medição para o marceneiro, incluindo subrotas', () => {
    expect(podeAcessar('MARCENEIRO', '/app/os/123')).toBe(true);
    expect(podeAcessar('MARCENEIRO', '/app/chapas')).toBe(true);
    expect(podeAcessar('MARCENEIRO', '/app/medicao')).toBe(true);
  });

  it('rota desconhecida dentro de /app é negada', () => {
    expect(podeAcessar('GESTOR', '/app/segredo')).toBe(false);
  });
});

describe('menuPara', () => {
  it('esconde itens sem permissão', () => {
    const rotulos = menuPara('MARCENEIRO').map((m) => m.href);
    expect(rotulos).not.toContain('/app');
    expect(rotulos).not.toContain('/app/leads');
    expect(rotulos).toContain('/app/os');
  });
});

describe('rotaInicial', () => {
  it('gestor vai ao dashboard; demais às OS', () => {
    expect(rotaInicial('GESTOR')).toBe('/app');
    expect(rotaInicial('COMERCIAL')).toBe('/app/os');
  });
});
