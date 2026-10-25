import { ROTULO_ETAPA, type EtapaOS } from '../dominio/os-fluxo';
import type { SimulacaoVolume } from '../dominio/b2b';
import { EMPRESA } from '../dominio/empresa';
import { brl, campos, cnpjFormatado, dataBr, gerarPdf, paragrafo, secao, tabela, total, type OpcoesPdf } from './documento';

/** Geradores puros de PDF (RF24): recebem dados prontos e devolvem o arquivo. Sem acesso a banco. */

const ROTULO_PRIORIDADE = { BAIXA: 'Baixa', NORMAL: 'Normal', ALTA: 'Alta', EMERGENCIAL: 'Emergencial' } as const;
const ROTULO_FORMA = { PIX: 'PIX', CARTAO: 'Cartão', PARCELADO: 'Parcelado' } as const;
const ROTULO_TIPO_EMPRESA = { IMOBILIARIA: 'Imobiliária', CONSTRUTORA: 'Construtora', EMPREITEIRA: 'Empreiteira' } as const;

export interface PreviaPdf {
  custoMdf: number;
  custoFita: number;
  custoFerragens: number;
  custoMaoDeObra: number;
  custoTotal: number;
  margemPct: number;
  margemValor: number;
  valorFinal: number;
}

export interface DadosOrcamento {
  projeto: { nome: string; ambiente?: string | null };
  cliente?: { nome: string; telefone?: string | null } | null;
  pecas: { nome: string; larguraMm: number; alturaMm: number; quantidade: number; material: string; veio: boolean }[];
  materiais: { nome: string; chapasUsadas: number; aproveitamentoPct: number }[];
  previa: PreviaPdf;
}

export function pdfOrcamentoProjeto(d: DadosOrcamento, opcoes: OpcoesPdf = {}): Promise<Buffer> {
  return gerarPdf('Orçamento', opcoes, (doc) => {
    campos(doc, [
      ['Projeto', d.projeto.nome],
      ['Ambiente', d.projeto.ambiente ?? '—'],
      ['Cliente', d.cliente?.nome ?? '—'],
      ['Validade', '15 dias'],
    ]);
    secao(doc, 'Peças (cut list)');
    tabela(
      doc,
      [
        { titulo: 'Peça', largura: 150 },
        { titulo: 'Medidas (mm)', largura: 100 },
        { titulo: 'Qtd', largura: 40, alinhar: 'right' },
        { titulo: 'Material', largura: 150 },
        { titulo: 'Veio', largura: 59, alinhar: 'center' },
      ],
      d.pecas.map((p) => [p.nome, `${p.larguraMm} × ${p.alturaMm}`, String(p.quantidade), p.material, p.veio ? 'sim' : 'não']),
    );
    secao(doc, 'Chapas');
    tabela(
      doc,
      [
        { titulo: 'Material', largura: 280 },
        { titulo: 'Chapas', largura: 100, alinhar: 'right' },
        { titulo: 'Aproveitamento', largura: 119, alinhar: 'right' },
      ],
      d.materiais.map((m) => [m.nome, String(m.chapasUsadas), `${m.aproveitamentoPct}%`]),
    );
    secao(doc, 'Investimento');
    tabela(
      doc,
      [
        { titulo: 'Item', largura: 360 },
        { titulo: 'Valor', largura: 139, alinhar: 'right' },
      ],
      [
        ['Chapas de MDF', brl(d.previa.custoMdf)],
        ['Fita de borda', brl(d.previa.custoFita)],
        ['Ferragens', brl(d.previa.custoFerragens)],
        ['Mão de obra (produção e instalação)', brl(d.previa.custoMaoDeObra)],
      ],
    );
    total(doc, 'Valor total', brl(d.previa.valorFinal));
    secao(doc, 'Condições');
    paragrafo(
      doc,
      `Entrada (50%): ${brl(Math.round(d.previa.valorFinal * 50) / 100)} na aprovação; saldo na entrega. ` +
        'Formas de pagamento: PIX, cartão ou parcelado. Prazo de produção: 15 a 25 dias após a medição final.',
    );
  });
}

export interface DadosOs {
  codigo: string;
  cliente: { nome: string; telefone?: string | null };
  ambiente: string;
  status: EtapaOS;
  prioridade: keyof typeof ROTULO_PRIORIDADE;
  prazoAcordado: Date | null;
  prazoReal: Date | null;
  atrasoDias: number;
  valorTotal: number;
  valorRecebido: number;
  statusFinanceiro: string;
  historico: { para: EtapaOS; entrouEm: Date }[];
  pagamentos: { tipo: 'ENTRADA' | 'PARCELA'; forma: keyof typeof ROTULO_FORMA; valor: number; status: string; vencimento: Date | null; pagoEm: Date | null }[];
  materiais: { nome: string; quantidade: number }[];
}

export function pdfOrdemServico(d: DadosOs, opcoes: OpcoesPdf = {}): Promise<Buffer> {
  return gerarPdf(`Ordem de Serviço ${d.codigo}`, opcoes, (doc) => {
    campos(doc, [
      ['Cliente', d.cliente.nome],
      ['Telefone', d.cliente.telefone ?? '—'],
      ['Ambiente', d.ambiente],
      ['Etapa atual', ROTULO_ETAPA[d.status]],
      ['Prioridade', ROTULO_PRIORIDADE[d.prioridade]],
      ['Prazo acordado', dataBr(d.prazoAcordado)],
      ['Entrega real', dataBr(d.prazoReal)],
      ['Atraso', d.atrasoDias > 0 ? `${d.atrasoDias} dia(s)` : 'sem atraso'],
    ]);
    if (d.materiais.length) {
      secao(doc, 'Materiais vinculados');
      tabela(
        doc,
        [
          { titulo: 'Chapa', largura: 380 },
          { titulo: 'Qtd', largura: 119, alinhar: 'right' },
        ],
        d.materiais.map((m) => [m.nome, String(m.quantidade)]),
      );
    }
    secao(doc, 'Histórico de etapas');
    tabela(
      doc,
      [
        { titulo: 'Etapa', largura: 250 },
        { titulo: 'Entrou em', largura: 249 },
      ],
      d.historico.map((h) => [ROTULO_ETAPA[h.para], dataBr(h.entrouEm)]),
    );
    secao(doc, 'Financeiro');
    campos(doc, [
      ['Valor total', brl(d.valorTotal)],
      ['Recebido', brl(d.valorRecebido)],
      ['Saldo', brl(Math.max(0, d.valorTotal - d.valorRecebido))],
      ['Situação', d.statusFinanceiro],
    ]);
    if (d.pagamentos.length) {
      doc.moveDown(0.4);
      tabela(
        doc,
        [
          { titulo: 'Tipo', largura: 80 },
          { titulo: 'Forma', largura: 80 },
          { titulo: 'Valor', largura: 100, alinhar: 'right' },
          { titulo: 'Vencimento', largura: 90, alinhar: 'center' },
          { titulo: 'Situação', largura: 149 },
        ],
        d.pagamentos.map((p) => [
          p.tipo === 'ENTRADA' ? 'Entrada' : 'Parcela',
          ROTULO_FORMA[p.forma],
          brl(p.valor),
          dataBr(p.vencimento),
          p.status === 'PAGO' ? `Pago em ${dataBr(p.pagoEm)}` : p.status,
        ]),
      );
    }
    secao(doc, 'Assinaturas');
    doc.moveDown(1.5);
    paragrafo(doc, '_______________________________          _______________________________');
    paragrafo(doc, `Cliente                                                          ${EMPRESA.nome}`);
  });
}

export interface DadosProposta {
  lead: {
    nomeEmpresa: string;
    cnpj: string;
    responsavel: string;
    tipo: keyof typeof ROTULO_TIPO_EMPRESA;
    unidades: number;
    bairro?: string | null;
    precisaMedicao: boolean;
  };
  valorUnitario: number;
  simulacao: SimulacaoVolume;
}

export function pdfPropostaB2B(d: DadosProposta, opcoes: OpcoesPdf = {}): Promise<Buffer> {
  const s = d.simulacao;
  return gerarPdf('Proposta Comercial B2B', opcoes, (doc) => {
    campos(doc, [
      ['Empresa', d.lead.nomeEmpresa],
      ['CNPJ', cnpjFormatado(d.lead.cnpj)],
      ['Responsável', d.lead.responsavel],
      ['Segmento', ROTULO_TIPO_EMPRESA[d.lead.tipo]],
      ['Local', d.lead.bairro ? `${d.lead.bairro} - Rio de Janeiro` : 'Rio de Janeiro'],
    ]);
    secao(doc, 'Pacote');
    paragrafo(
      doc,
      `${s.unidades} unidade(s) de móveis planejados produzidos em marcenaria própria na Zona Norte, com entrega em ${EMPRESA.areaAtendimento.toLowerCase()} ` +
        `e capacidade para ${EMPRESA.capacidadeProjetosSimultaneos} projetos simultâneos.` +
        (d.lead.precisaMedicao ? ' Inclui medição na obra.' : ''),
    );
    secao(doc, 'Investimento');
    tabela(
      doc,
      [
        { titulo: 'Item', largura: 330 },
        { titulo: 'Valor', largura: 169, alinhar: 'right' },
      ],
      [
        ['Valor unitário de tabela', brl(s.valorUnitario)],
        [`Desconto progressivo por volume (${s.descontoPct}%)`, `- ${brl(s.valorUnitario - s.valorUnitarioComDesconto)} por unidade`],
        ['Valor unitário com desconto', brl(s.valorUnitarioComDesconto)],
        [`Subtotal sem desconto (${s.unidades} un.)`, brl(s.valorBruto)],
        ['Economia total', brl(s.economia)],
      ],
    );
    total(doc, 'Valor total do pacote', brl(s.valorTotal));
    secao(doc, 'Cronograma');
    paragrafo(doc, `Prazo estimado: ${s.prazoDias} dias após aprovação e medição, com entregas parciais combinadas por etapa da obra.`);
    secao(doc, 'Condições de pagamento');
    paragrafo(doc, 'Entrada de 30% na assinatura, 40% no início da produção e 30% na entrega. PIX, boleto ou cartão. Garantia de 5 anos para construtoras.');
    paragrafo(doc, 'Proposta válida por 30 dias. Valores sujeitos a confirmação após visita técnica.');
  });
}

export interface DadosListaCompra {
  projeto: { nome: string };
  itens: { nome: string; quantidade: number; custoUnitario: number; custoTotal: number }[];
  doEstoque: { nome: string; quantidade: number }[];
}

export function pdfListaCompra(d: DadosListaCompra, opcoes: OpcoesPdf = {}): Promise<Buffer> {
  return gerarPdf('Lista de Compra', opcoes, (doc) => {
    campos(doc, [['Projeto', d.projeto.nome]]);
    secao(doc, 'Comprar');
    if (d.itens.length === 0) {
      paragrafo(doc, 'Nada a comprar: todas as chapas estão disponíveis em estoque.');
    } else {
      tabela(
        doc,
        [
          { titulo: 'Chapa', largura: 250 },
          { titulo: 'Qtd', largura: 50, alinhar: 'right' },
          { titulo: 'Unitário', largura: 100, alinhar: 'right' },
          { titulo: 'Total', largura: 99, alinhar: 'right' },
        ],
        d.itens.map((i) => [i.nome, String(i.quantidade), brl(i.custoUnitario), brl(i.custoTotal)]),
      );
      total(doc, 'Total da compra', brl(d.itens.reduce((s, i) => s + i.custoTotal, 0)));
    }
    if (d.doEstoque.length) {
      secao(doc, 'Do estoque (separar)');
      tabela(
        doc,
        [
          { titulo: 'Chapa', largura: 380 },
          { titulo: 'Qtd', largura: 119, alinhar: 'right' },
        ],
        d.doEstoque.map((i) => [i.nome, String(i.quantidade)]),
      );
    }
  });
}
