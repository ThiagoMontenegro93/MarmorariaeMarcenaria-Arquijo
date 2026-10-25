/** Faixas de desconto progressivo para volume B2B (até 25% — Módulo F). */
export const FAIXAS_DESCONTO = [
  { minUnidades: 100, descontoPct: 25 },
  { minUnidades: 50, descontoPct: 20 },
  { minUnidades: 20, descontoPct: 15 },
  { minUnidades: 10, descontoPct: 10 },
  { minUnidades: 3, descontoPct: 5 },
] as const;

export const PRAZO_BASE_DIAS = 20;

export function descontoPorVolume(unidades: number): number {
  return FAIXAS_DESCONTO.find((f) => unidades >= f.minUnidades)?.descontoPct ?? 0;
}

function arred2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

export interface SimulacaoVolume {
  unidades: number;
  valorUnitario: number;
  descontoPct: number;
  valorUnitarioComDesconto: number;
  valorBruto: number;
  valorTotal: number;
  economia: number;
  prazoDias: number;
}

/**
 * Calculadora B2B: valor unitário, total, desconto e prazo estimado.
 * Prazo: 20 dias para até 10 unidades + 5 dias a cada 10 unidades adicionais
 * (premissa a validar com a produção; capacidade declarada de 50 projetos simultâneos).
 */
export function simularPropostaVolume(e: { unidades: number; valorUnitario: number }): SimulacaoVolume {
  if (!Number.isInteger(e.unidades) || e.unidades < 1) throw new Error('Quantidade de unidades deve ser um inteiro >= 1.');
  if (!Number.isFinite(e.valorUnitario) || e.valorUnitario <= 0) throw new Error('Valor unitário deve ser maior que zero.');
  const descontoPct = descontoPorVolume(e.unidades);
  const valorUnitarioComDesconto = arred2(e.valorUnitario * (1 - descontoPct / 100));
  const valorBruto = arred2(e.valorUnitario * e.unidades);
  const valorTotal = arred2(valorUnitarioComDesconto * e.unidades);
  return {
    unidades: e.unidades,
    valorUnitario: e.valorUnitario,
    descontoPct,
    valorUnitarioComDesconto,
    valorBruto,
    valorTotal,
    economia: arred2(valorBruto - valorTotal),
    prazoDias: PRAZO_BASE_DIAS + Math.ceil(Math.max(0, e.unidades - 10) / 10) * 5,
  };
}
