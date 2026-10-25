import { describe, expect, it } from 'vitest';
import {
  calcularPlanoCorte,
  MaterialNaoEncontradoError,
  PecaMaiorQueChapaError,
  type PecaPosicionada,
  type Chapa,
  type Peca,
} from '../src';
import { chapaBranco15, chapaFreijo18, pecasExemploPdf } from './fixtures';

const chapas = [chapaFreijo18, chapaBranco15];

function sobrepoe(a: PecaPosicionada, b: PecaPosicionada): boolean {
  return a.x < b.x + b.largura && b.x < a.x + a.largura && a.y < b.y + b.altura && b.y < a.y + a.altura;
}

describe('calcularPlanoCorte — exemplo do PDF', () => {
  const r = calcularPlanoCorte(pecasExemploPdf, chapas);

  it('agrupa por material e usa 1 chapa de cada', () => {
    expect(r.materiais).toHaveLength(2);
    const freijo = r.materiais.find((m) => m.chapa.id === 'freijo-18')!;
    const branco = r.materiais.find((m) => m.chapa.id === 'branco-15')!;
    expect(freijo.chapasUsadas).toBe(1);
    expect(branco.chapasUsadas).toBe(1);
    expect(r.totalChapas).toBe(2);
  });

  it('posiciona todas as peças (expandidas por quantidade)', () => {
    const freijo = r.materiais.find((m) => m.chapa.id === 'freijo-18')!;
    const branco = r.materiais.find((m) => m.chapa.id === 'branco-15')!;
    expect(freijo.planos.flatMap((p) => p.pecas)).toHaveLength(4);
    expect(branco.planos.flatMap((p) => p.pecas)).toHaveLength(5);
  });

  it('calcula aproveitamento e desperdício a partir das áreas', () => {
    const freijo = r.materiais.find((m) => m.chapa.id === 'freijo-18')!;
    // (2*700*400 + 2*2100*600) / (2750*1850) = 3.080.000 / 5.087.500 = 60,54%
    expect(freijo.areaPecasMm2).toBe(3_080_000);
    expect(freijo.aproveitamentoPct).toBeCloseTo(60.54, 2);
    expect(freijo.desperdicioPct).toBeCloseTo(39.46, 2);
  });

  it('separa estoque e compra', () => {
    const freijo = r.materiais.find((m) => m.chapa.id === 'freijo-18')!;
    const branco = r.materiais.find((m) => m.chapa.id === 'branco-15')!;
    expect(freijo).toMatchObject({ qtdDoEstoque: 0, qtdCompra: 1, custoCompra: 280, custoTotal: 280 });
    expect(branco).toMatchObject({ qtdDoEstoque: 1, qtdCompra: 0, custoCompra: 0, custoTotal: 310 });
    expect(r.listaCompra).toEqual([{ chapaId: 'freijo-18', nome: 'MDF Freijó 18mm', quantidade: 1, custoUnitario: 280, custoTotal: 280 }]);
  });

  it('peças não se sobrepõem, ficam dentro da chapa e respeitam a serra de 4mm', () => {
    for (const m of r.materiais) {
      for (const plano of m.planos) {
        for (const p of plano.pecas) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.x + p.largura).toBeLessThanOrEqual(m.chapa.larguraMm);
          expect(p.y + p.altura).toBeLessThanOrEqual(m.chapa.alturaMm);
        }
        const ps = plano.pecas;
        for (let i = 0; i < ps.length; i++) {
          for (let j = i + 1; j < ps.length; j++) {
            const a = ps[i]!;
            const b = ps[j]!;
            // expande "a" pela serra: nenhuma peça pode invadir o corte
            const aComSerra = { ...a, largura: a.largura + 4, altura: a.altura + 4 };
            const bComSerra = { ...b, largura: b.largura + 4, altura: b.altura + 4 };
            expect(sobrepoe(aComSerra, b) || sobrepoe(bComSerra, a)).toBe(false);
          }
        }
      }
    }
  });

  it('lista sobras reaproveitáveis (>= 300x300) e nenhuma menor que isso', () => {
    const todas = r.materiais.flatMap((m) => m.planos.flatMap((p) => p.sobras));
    expect(todas.length).toBeGreaterThan(0);
    for (const s of todas) {
      expect(Math.min(s.largura, s.altura)).toBeGreaterThanOrEqual(300);
    }
  });
});

describe('calcularPlanoCorte — validações', () => {
  it('peça maior que a chapa gera erro claro', () => {
    const pecas: Peca[] = [{ nome: 'Tampo gigante', larguraMm: 3000, alturaMm: 2000, quantidade: 1, chapaId: 'freijo-18', veio: false }];
    expect(() => calcularPlanoCorte(pecas, chapas)).toThrow(PecaMaiorQueChapaError);
    expect(() => calcularPlanoCorte(pecas, chapas)).toThrow(/Tampo gigante.*3000x2000.*MDF Freijó 18mm.*2750x1850/);
  });

  it('material sem chapa cadastrada gera erro', () => {
    const pecas: Peca[] = [{ nome: 'Porta', larguraMm: 500, alturaMm: 500, quantidade: 1, chapaId: 'inexistente', veio: false }];
    expect(() => calcularPlanoCorte(pecas, chapas)).toThrow(MaterialNaoEncontradoError);
  });

  it('rejeita medidas ou quantidades inválidas', () => {
    const pecas: Peca[] = [{ nome: 'X', larguraMm: 0, alturaMm: 500, quantidade: 1, chapaId: 'freijo-18', veio: false }];
    expect(() => calcularPlanoCorte(pecas, chapas)).toThrow(/medida/i);
    const pecas2: Peca[] = [{ nome: 'X', larguraMm: 100, alturaMm: 500, quantidade: 1.5, chapaId: 'freijo-18', veio: false }];
    expect(() => calcularPlanoCorte(pecas2, chapas)).toThrow(/quantidade/i);
  });

  it('lista vazia retorna resultado vazio', () => {
    const r = calcularPlanoCorte([], chapas);
    expect(r.materiais).toEqual([]);
    expect(r.totalChapas).toBe(0);
  });
});

describe('calcularPlanoCorte — veio', () => {
  const chapa: Chapa = { id: 'c', nome: 'Chapa teste', larguraMm: 1000, alturaMm: 500, espessuraMm: 18, qtdEstoque: 0, custoUnitario: 100 };

  it('peça com veio que só cabe girada gera erro (não pode rotacionar)', () => {
    const pecas: Peca[] = [{ nome: 'Porta veio', larguraMm: 400, alturaMm: 900, quantidade: 1, chapaId: 'c', veio: true }];
    expect(() => calcularPlanoCorte(pecas, [chapa])).toThrow(/veio/);
  });

  it('peça sem veio é girada quando necessário', () => {
    const pecas: Peca[] = [{ nome: 'Porta', larguraMm: 400, alturaMm: 900, quantidade: 1, chapaId: 'c', veio: false }];
    const r = calcularPlanoCorte(pecas, [chapa]);
    const p = r.materiais[0]!.planos[0]!.pecas[0]!;
    expect(p.rotacionada).toBe(true);
    expect(p.largura).toBe(900);
    expect(p.altura).toBe(400);
  });

  it('peças com veio nunca aparecem rotacionadas', () => {
    const pecas: Peca[] = [
      { nome: 'A', larguraMm: 300, alturaMm: 450, quantidade: 6, chapaId: 'c', veio: true },
      { nome: 'B', larguraMm: 450, alturaMm: 200, quantidade: 4, chapaId: 'c', veio: true },
    ];
    const r = calcularPlanoCorte(pecas, [chapa]);
    for (const p of r.materiais[0]!.planos.flatMap((pl) => pl.pecas)) {
      expect(p.rotacionada).toBe(false);
    }
  });
});

describe('calcularPlanoCorte — serra configurável', () => {
  const chapa: Chapa = { id: 'c', nome: 'Chapa teste', larguraMm: 1000, alturaMm: 500, espessuraMm: 18, qtdEstoque: 0, custoUnitario: 100 };
  const pecas: Peca[] = [{ nome: 'Tira', larguraMm: 500, alturaMm: 500, quantidade: 2, chapaId: 'c', veio: true }];

  it('com serra 0 duas peças de 500 cabem em 1000', () => {
    expect(calcularPlanoCorte(pecas, [chapa], { espessuraSerraMm: 0 }).totalChapas).toBe(1);
  });

  it('com serra padrão (4mm) precisa de 2 chapas', () => {
    expect(calcularPlanoCorte(pecas, [chapa]).totalChapas).toBe(2);
  });
});

describe('calcularPlanoCorte — desempenho (RNF01)', () => {
  it('50 peças em menos de 2s', () => {
    const pecas: Peca[] = Array.from({ length: 50 }, (_, i) => ({
      nome: `Peça ${i + 1}`,
      larguraMm: 200 + ((i * 137) % 1500),
      alturaMm: 150 + ((i * 89) % 900),
      quantidade: 1,
      chapaId: i % 2 === 0 ? 'freijo-18' : 'branco-15',
      veio: i % 3 === 0,
    }));
    const inicio = performance.now();
    const r = calcularPlanoCorte(pecas, chapas);
    const ms = performance.now() - inicio;
    expect(ms).toBeLessThan(2000);
    expect(r.materiais.flatMap((m) => m.planos.flatMap((p) => p.pecas))).toHaveLength(50);
  });
});
