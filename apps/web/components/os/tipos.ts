import type { Etapa, Prioridade } from '@/lib/formato';

export interface OsResumo {
  id: string;
  codigo: string;
  numero: number;
  ambiente: string;
  status: Etapa;
  prioridade: Prioridade;
  prazoAcordado: string | null;
  atrasoDias: number;
  valorTotal: string;
  statusFinanceiro: 'PENDENTE' | 'PARCIAL' | 'PAGO';
  cliente: { id: string; nome: string; telefone: string };
  responsavel: { id: string; nome: string } | null;
}

export interface Pagamento {
  id: string;
  tipo: 'ENTRADA' | 'PARCELA';
  forma: 'PIX' | 'CARTAO' | 'PARCELADO';
  valor: string;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  vencimento: string | null;
  pagoEm: string | null;
}

export interface OsDetalhe extends OsResumo {
  descricao: string | null;
  dataOrcamento: string;
  dataAprovacao: string | null;
  prazoReal: string | null;
  valorEntrada: string;
  valorRecebido: string;
  saldo: number;
  rotuloEtapa: string;
  projeto: { id: string; nome: string } | null;
  materiais: { totalChapas: number; aproveitamentoGeralPct: number; listaCompra: { nome: string; quantidade: number; custoTotal: number }[] } | null;
  timeline: { etapa: Etapa; rotulo: string; entrouEm: string; saiuEm: string | null; duracaoHoras: number; usuario: string | null; observacao: string | null }[];
  pagamentos: Pagamento[];
  mensagens: { id: string; mensagem: string; criadoEm: string; canal: string; status: string }[];
}
