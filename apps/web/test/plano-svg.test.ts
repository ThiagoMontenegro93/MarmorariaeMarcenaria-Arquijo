import { describe, expect, it } from 'vitest';
import { corDaPeca, layoutPlano } from '@/lib/plano-svg';

describe('corDaPeca', () => {
  it('é determinística pelo nome', () => {
    expect(corDaPeca('Porta')).toBe(corDaPeca('Porta'));
    expect(corDaPeca('Porta')).not.toBe(corDaPeca('Lateral'));
  });
});

describe('layoutPlano', () => {
  it('mantém a proporção da chapa e escala as peças', () => {
    const l = layoutPlano(
      { larguraMm: 2750, alturaMm: 1850 },
      [{ nome: 'Lateral', x: 0, y: 0, largura: 2100, altura: 600, rotacionada: false }],
      [{ x: 2104, y: 0, largura: 646, altura: 600 }],
      550,
    );
    expect(l.largura).toBe(550);
    expect(l.altura).toBe(370);
    expect(l.pecas[0]).toMatchObject({ x: 0, y: 0, w: 420, h: 120 });
    expect(l.sobras[0]!.rotulo).toBe('646×600');
  });

  it('só mostra rótulo quando a peça cabe o texto', () => {
    const l = layoutPlano({ larguraMm: 1000, alturaMm: 1000 }, [{ nome: 'Tira', x: 0, y: 0, largura: 20, altura: 900, rotacionada: true }], [], 100);
    expect(l.pecas[0]!.mostrarRotulo).toBe(false);
  });
});
