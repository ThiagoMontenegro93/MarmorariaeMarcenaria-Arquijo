import { describe, expect, it } from 'vitest';
import { calcularMetrosFitaBorda, calcularPreviaCusto, estimativaPorArea } from '../src';
import { chapaFreijo18, pecasExemploPdf } from './fixtures';

describe('calcularMetrosFitaBorda', () => {
  it('soma o perímetro de todas as peças (x quantidade) em metros', () => {
    // Porta 2x(2*(700+400))=4400; Lateral 2x(2*(2100+600))=10800;
    // Prateleira 4x(2*(560+400))=7680; Fundo 1x(2*(2100+580))=5360 => 28240mm
    expect(calcularMetrosFitaBorda(pecasExemploPdf)).toBeCloseTo(28.24, 2);
  });
});

describe('calcularPreviaCusto', () => {
  it('soma MDF + fita + ferragens + mão de obra e aplica margem padrão de 30%', () => {
    const r = calcularPreviaCusto({
      chapas: [
        { quantidade: 1, custoUnitario: 280 },
        { quantidade: 1, custoUnitario: 310 },
      ],
      metrosFitaBorda: 28.24,
      precoFitaPorMetro: 2.5,
      ferragens: [
        { nome: 'Dobradiça com amortecimento', quantidade: 4, precoUnitario: 18 },
        { nome: 'Corrediça telescópica', quantidade: 2, precoUnitario: 45 },
      ],
      horasMaoDeObra: 16,
      valorHora: 60,
    });
    expect(r.custoMdf).toBe(590);
    expect(r.custoFita).toBe(70.6);
    expect(r.custoFerragens).toBe(162);
    expect(r.custoMaoDeObra).toBe(960);
    expect(r.custoTotal).toBe(1782.6);
    expect(r.margemPct).toBe(30);
    expect(r.margemValor).toBe(534.78);
    expect(r.valorFinal).toBe(2317.38);
  });

  it('aceita margem customizada e rejeita valores negativos', () => {
    const base = { chapas: [{ quantidade: 2, custoUnitario: 100 }], metrosFitaBorda: 0, precoFitaPorMetro: 0, ferragens: [], horasMaoDeObra: 0, valorHora: 0 };
    expect(calcularPreviaCusto({ ...base, margemPct: 50 }).valorFinal).toBe(300);
    expect(() => calcularPreviaCusto({ ...base, valorHora: -1 })).toThrow(/negativ/);
  });
});

describe('estimativaPorArea', () => {
  it('aplica fator de perda de 15% sobre a área (estimativa rápida do PDF)', () => {
    // área Freijó 3.080.000 * 1,15 / 5.087.500 = 0,696 => 1 chapa; com fator 1,7 => 1,03 => 2
    const pecasFreijo = pecasExemploPdf.filter((p) => p.chapaId === 'freijo-18');
    expect(estimativaPorArea(pecasFreijo, chapaFreijo18)).toBe(1);
    expect(estimativaPorArea(pecasFreijo, chapaFreijo18, 1.7)).toBe(2);
  });
});
