/** Geometria do desenho do plano de corte (SVG), separada da UI para ser testável. */

export interface PecaPlano {
  nome: string;
  x: number;
  y: number;
  largura: number;
  altura: number;
  rotacionada: boolean;
}

export interface SobraPlano {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

/** Paleta madeira/pedra para as peças. */
const PALETA = ['#d9b48f', '#c99a6b', '#b7c4b0', '#e3cfa8', '#a9b8c6', '#d8a7a0', '#c8bfa9', '#9fc3b5', '#e0bf8a', '#b9a6c9'];

export function corDaPeca(nome: string): string {
  let h = 0;
  for (const c of nome.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length]!;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

export function layoutPlano(chapa: { larguraMm: number; alturaMm: number }, pecas: PecaPlano[], sobras: SobraPlano[], larguraPx: number) {
  const s = larguraPx / chapa.larguraMm;
  return {
    largura: larguraPx,
    altura: r2(chapa.alturaMm * s),
    pecas: pecas.map((p) => {
      const w = r2(p.largura * s);
      const h = r2(p.altura * s);
      return {
        x: r2(p.x * s),
        y: r2(p.y * s),
        w,
        h,
        cor: corDaPeca(p.nome),
        rotulo: `${p.nome}${p.rotacionada ? ' ↻' : ''}`,
        medidas: `${p.largura}×${p.altura}`,
        mostrarRotulo: w > 30 && h > 14,
      };
    }),
    sobras: sobras.map((f) => ({ x: r2(f.x * s), y: r2(f.y * s), w: r2(f.largura * s), h: r2(f.altura * s), rotulo: `${Math.round(f.largura)}×${Math.round(f.altura)}` })),
  };
}
