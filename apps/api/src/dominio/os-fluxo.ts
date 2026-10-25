import { diferencaDias } from './datas';

/** As 9 etapas do Kanban (Módulo C), na ordem. Espelha o enum StatusOS do Prisma. */
export const ETAPAS_OS = [
  'ORCAMENTO',
  'APROVADO',
  'MEDICAO',
  'COMPRA_MATERIAIS',
  'PRODUCAO',
  'INSTALACAO',
  'ENTREGA',
  'RECEBIMENTO',
  'FINALIZADO',
] as const;

export type EtapaOS = (typeof ETAPAS_OS)[number];

export const ROTULO_ETAPA: Record<EtapaOS, string> = {
  ORCAMENTO: 'Orçamento',
  APROVADO: 'Aprovado',
  MEDICAO: 'Medição',
  COMPRA_MATERIAIS: 'Compra de materiais',
  PRODUCAO: 'Produção',
  INSTALACAO: 'Instalação',
  ENTREGA: 'Entrega',
  RECEBIMENTO: 'Recebimento',
  FINALIZADO: 'Finalizado',
};

/** Cores do Kanban (RF11/RF12) — o front usa como referência. */
export const COR_ETAPA: Record<EtapaOS, string> = {
  ORCAMENTO: 'cinza',
  APROVADO: 'azul',
  MEDICAO: 'amarelo',
  COMPRA_MATERIAIS: 'laranja',
  PRODUCAO: 'roxo',
  INSTALACAO: 'azul-escuro',
  ENTREGA: 'verde-claro',
  RECEBIMENTO: 'verde',
  FINALIZADO: 'verde-escuro',
};

/** Etapas em que a entrega já aconteceu (não contam como "atrasada em andamento"). */
export const ETAPAS_POS_ENTREGA: readonly EtapaOS[] = ['ENTREGA', 'RECEBIMENTO', 'FINALIZADO'];

export function indiceEtapa(etapa: EtapaOS): number {
  return ETAPAS_OS.indexOf(etapa);
}

/** Próxima etapa do fluxo, ou null se a OS já está finalizada. */
export function proximaEtapa(atual: EtapaOS): EtapaOS | null {
  const i = indiceEtapa(atual);
  return i >= 0 && i < ETAPAS_OS.length - 1 ? ETAPAS_OS[i + 1]! : null;
}

/**
 * Dias de atraso (RF13): compara o prazo acordado com a entrega real ou, se ainda
 * não entregue, com hoje. Conta dias civis no fuso do Rio; nunca negativo.
 */
export function calcularAtrasoDias(prazoAcordado: Date | null, prazoReal: Date | null, hoje: Date): number {
  if (!prazoAcordado) return 0;
  return Math.max(0, diferencaDias(prazoAcordado, prazoReal ?? hoje));
}

function arred2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/** Entrada padrão de 50% do valor total (RF15). */
export function valorEntradaPadrao(valorTotal: number): number {
  return arred2(valorTotal / 2);
}

export type StatusFinanceiro = 'PENDENTE' | 'PARCIAL' | 'PAGO';

export function calcularStatusFinanceiro(valorTotal: number, valorRecebido: number): StatusFinanceiro {
  if (valorTotal <= 0 || valorRecebido <= 0) return 'PENDENTE';
  return valorRecebido + 0.005 >= valorTotal ? 'PAGO' : 'PARCIAL';
}
