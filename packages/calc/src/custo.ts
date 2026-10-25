import { ErroValidacaoCalculo } from './erros';
import { arredondar2 } from './numeros';
import type { Chapa, Peca } from './tipos';

export const MARGEM_PADRAO_PCT = 30;
export const FATOR_PERDA_PADRAO = 1.15;

export interface ItemFerragem {
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface EntradaPreviaCusto {
  /** Chapas a serem consumidas (normalmente vindas do cálculo do plano de corte). */
  chapas: { quantidade: number; custoUnitario: number }[];
  metrosFitaBorda: number;
  precoFitaPorMetro: number;
  ferragens: ItemFerragem[];
  horasMaoDeObra: number;
  valorHora: number;
  /** Margem sobre o custo. Padrão 30%. */
  margemPct?: number;
}

export interface PreviaCusto {
  custoMdf: number;
  custoFita: number;
  custoFerragens: number;
  custoMaoDeObra: number;
  custoTotal: number;
  margemPct: number;
  margemValor: number;
  valorFinal: number;
}

function naoNegativo(valor: number, rotulo: string): void {
  if (!Number.isFinite(valor) || valor < 0) {
    throw new ErroValidacaoCalculo(`${rotulo} não pode ser negativo (recebido: ${valor}).`);
  }
}

/** Metros de fita de borda = perímetro de todas as peças (x quantidade), em metros. */
export function calcularMetrosFitaBorda(pecas: Pick<Peca, 'larguraMm' | 'alturaMm' | 'quantidade'>[]): number {
  const mm = pecas.reduce((s, p) => s + 2 * (p.larguraMm + p.alturaMm) * p.quantidade, 0);
  return arredondar2(mm / 1000);
}

/**
 * Prévia de gasto para orçamento — RF05.
 * Total custo = MDF + fita + ferragens + mão de obra; valor final = custo + margem.
 */
export function calcularPreviaCusto(e: EntradaPreviaCusto): PreviaCusto {
  const margemPct = e.margemPct ?? MARGEM_PADRAO_PCT;
  naoNegativo(e.metrosFitaBorda, 'Metros de fita');
  naoNegativo(e.precoFitaPorMetro, 'Preço da fita por metro');
  naoNegativo(e.horasMaoDeObra, 'Horas de mão de obra');
  naoNegativo(e.valorHora, 'Valor da hora');
  naoNegativo(margemPct, 'Margem');
  for (const c of e.chapas) {
    naoNegativo(c.quantidade, 'Quantidade de chapas');
    naoNegativo(c.custoUnitario, 'Custo da chapa');
  }
  for (const f of e.ferragens) {
    naoNegativo(f.quantidade, `Quantidade de "${f.nome}"`);
    naoNegativo(f.precoUnitario, `Preço de "${f.nome}"`);
  }

  const custoMdf = arredondar2(e.chapas.reduce((s, c) => s + c.quantidade * c.custoUnitario, 0));
  const custoFita = arredondar2(e.metrosFitaBorda * e.precoFitaPorMetro);
  const custoFerragens = arredondar2(e.ferragens.reduce((s, f) => s + f.quantidade * f.precoUnitario, 0));
  const custoMaoDeObra = arredondar2(e.horasMaoDeObra * e.valorHora);
  const custoTotal = arredondar2(custoMdf + custoFita + custoFerragens + custoMaoDeObra);
  const margemValor = arredondar2((custoTotal * margemPct) / 100);

  return {
    custoMdf,
    custoFita,
    custoFerragens,
    custoMaoDeObra,
    custoTotal,
    margemPct,
    margemValor,
    valorFinal: arredondar2(custoTotal + margemValor),
  };
}

/**
 * Estimativa rápida citada no prompt mestre: área das peças / área da chapa x fator de perda (15%).
 * Útil como conferência do plano de corte; o número oficial vem de `calcularPlanoCorte`.
 */
export function estimativaPorArea(
  pecas: Pick<Peca, 'larguraMm' | 'alturaMm' | 'quantidade'>[],
  chapa: Pick<Chapa, 'larguraMm' | 'alturaMm'>,
  fatorPerda: number = FATOR_PERDA_PADRAO,
): number {
  const area = pecas.reduce((s, p) => s + p.larguraMm * p.alturaMm * p.quantidade, 0);
  return Math.ceil((area * fatorPerda) / (chapa.larguraMm * chapa.alturaMm));
}
