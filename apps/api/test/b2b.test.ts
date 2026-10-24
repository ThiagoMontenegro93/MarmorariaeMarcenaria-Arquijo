import { describe, expect, it } from 'vitest';
import { descontoPorVolume, simularPropostaVolume } from '../src/dominio/b2b';

describe('descontoPorVolume (desconto progressivo até 25%)', () => {
  it('segue as faixas', () => {
    expect(descontoPorVolume(1)).toBe(0);
    expect(descontoPorVolume(3)).toBe(5);
    expect(descontoPorVolume(10)).toBe(10);
    expect(descontoPorVolume(20)).toBe(15);
    expect(descontoPorVolume(50)).toBe(20);
    expect(descontoPorVolume(100)).toBe(25);
    expect(descontoPorVolume(500)).toBe(25);
  });
});

describe('simularPropostaVolume (calculadora B2B)', () => {
  it('20 cozinhas: unitário, total, desconto e prazo', () => {
    const r = simularPropostaVolume({ unidades: 20, valorUnitario: 12400 });
    expect(r.descontoPct).toBe(15);
    expect(r.valorUnitarioComDesconto).toBe(10540);
    expect(r.valorBruto).toBe(248000);
    expect(r.valorTotal).toBe(210800);
    expect(r.economia).toBe(37200);
    expect(r.prazoDias).toBeGreaterThanOrEqual(20);
  });

  it('rejeita quantidade inválida', () => {
    expect(() => simularPropostaVolume({ unidades: 0, valorUnitario: 100 })).toThrow();
  });
});
