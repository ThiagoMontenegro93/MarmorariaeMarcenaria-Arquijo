export const ETAPAS = [
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
export type Etapa = (typeof ETAPAS)[number];

export const ROTULO_ETAPA: Record<Etapa, string> = {
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

/** Cores do Kanban (Módulo C). */
export const COR_ETAPA: Record<Etapa, string> = {
  ORCAMENTO: 'bg-stone-400',
  APROVADO: 'bg-blue-500',
  MEDICAO: 'bg-yellow-400',
  COMPRA_MATERIAIS: 'bg-orange-500',
  PRODUCAO: 'bg-purple-500',
  INSTALACAO: 'bg-blue-900',
  ENTREGA: 'bg-green-300',
  RECEBIMENTO: 'bg-green-500',
  FINALIZADO: 'bg-green-800',
};

export type Prioridade = 'BAIXA' | 'NORMAL' | 'ALTA' | 'EMERGENCIAL';
export const ESTILO_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: 'bg-prioridade-baixa text-white',
  NORMAL: 'bg-prioridade-normal text-white',
  ALTA: 'bg-prioridade-alta text-white',
  EMERGENCIAL: 'bg-prioridade-emergencial text-white animate-pulse',
};
export const ROTULO_PRIORIDADE: Record<Prioridade, string> = { BAIXA: 'Baixa', NORMAL: 'Normal', ALTA: 'Alta', EMERGENCIAL: 'Emergencial' };

export function brl(v: number | string | null | undefined): string {
  return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function data(v: string | Date | null | undefined): string {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function dataHora(v: string | Date | null | undefined): string {
  if (!v) return '—';
  return new Date(v).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
}
