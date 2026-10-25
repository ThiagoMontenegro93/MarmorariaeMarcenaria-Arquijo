import { Injectable, NotFoundException } from '@nestjs/common';
import { num } from '../../common/numero';
import { simularPropostaVolume } from '../../dominio/b2b';
import { calcularAtrasoDias } from '../../dominio/os-fluxo';
import { pdfListaCompra, pdfOrcamentoProjeto, pdfOrdemServico, pdfPropostaB2B } from '../../pdf/geradores';
import { PrismaService } from '../../prisma/prisma.service';
import { CalculoProjetoService } from '../projetos/calculo-projeto.service';

/** Valor unitário padrão da proposta B2B quando não informado: Cozinha Americana do catálogo. */
const VALOR_UNITARIO_PADRAO = 12400;

/** Carrega os dados do banco e chama os geradores puros de PDF (RF24). */
@Injectable()
export class PdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculo: CalculoProjetoService,
  ) {}

  async orcamentoProjeto(id: string) {
    const calc = await this.calculo.calcular(id);
    const projeto = await this.prisma.projeto.findUniqueOrThrow({ where: { id }, include: { cliente: true, pecas: { include: { chapa: true } } } });
    return pdfOrcamentoProjeto({
      projeto: { nome: projeto.nome, ambiente: projeto.ambiente },
      cliente: projeto.cliente ? { nome: projeto.cliente.nome, telefone: projeto.cliente.telefone } : null,
      pecas: projeto.pecas.map((p) => ({ nome: p.nome, larguraMm: p.larguraMm, alturaMm: p.alturaMm, quantidade: p.quantidade, material: p.chapa.nome, veio: p.veio })),
      materiais: calc.resultado.materiais.map((m) => ({ nome: m.chapa.nome, chapasUsadas: m.chapasUsadas, aproveitamentoPct: m.aproveitamentoPct })),
      previa: calc.previa,
    });
  }

  async listaCompra(id: string) {
    const calc = await this.calculo.calcular(id);
    const projeto = await this.prisma.projeto.findUniqueOrThrow({ where: { id }, select: { nome: true } });
    return pdfListaCompra({
      projeto,
      itens: calc.resultado.listaCompra,
      doEstoque: calc.resultado.materiais.filter((m) => m.qtdDoEstoque > 0).map((m) => ({ nome: m.chapa.nome, quantidade: m.qtdDoEstoque })),
    });
  }

  async ordemServico(id: string) {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id, deletadoEm: null },
      include: { cliente: true, historico: { orderBy: { entrouEm: 'asc' } }, pagamentos: { where: { status: { not: 'CANCELADO' } }, orderBy: { criadoEm: 'asc' } } },
    });
    if (!os) throw new NotFoundException('Ordem de serviço não encontrada.');
    const mat = os.materiais as { porMaterial?: { nome: string; chapasUsadas: number }[] } | null;
    return {
      nome: `OS-${os.numero}`,
      pdf: await pdfOrdemServico({
        codigo: `OS-${os.numero}`,
        cliente: { nome: os.cliente.nome, telefone: os.cliente.telefone },
        ambiente: os.ambiente,
        status: os.status,
        prioridade: os.prioridade,
        prazoAcordado: os.prazoAcordado,
        prazoReal: os.prazoReal,
        atrasoDias: calcularAtrasoDias(os.prazoAcordado, os.prazoReal, new Date()),
        valorTotal: num(os.valorTotal),
        valorRecebido: num(os.valorRecebido),
        statusFinanceiro: os.statusFinanceiro,
        historico: os.historico.map((h) => ({ para: h.para, entrouEm: h.entrouEm })),
        pagamentos: os.pagamentos.map((p) => ({ tipo: p.tipo, forma: p.forma, valor: num(p.valor), status: p.status, vencimento: p.vencimento, pagoEm: p.pagoEm })),
        materiais: (mat?.porMaterial ?? []).map((m) => ({ nome: m.nome, quantidade: m.chapasUsadas })),
      }),
    };
  }

  async propostaB2B(id: string, valorUnitario?: number) {
    const lead = await this.prisma.leadB2B.findFirst({ where: { id, deletadoEm: null } });
    if (!lead) throw new NotFoundException('Lead não encontrado.');
    const estimado = lead.orcamentoEstimado ? num(lead.orcamentoEstimado) / lead.unidades : undefined;
    const unitario = valorUnitario ?? (estimado && estimado > 0 ? Math.round(estimado * 100) / 100 : VALOR_UNITARIO_PADRAO);
    return pdfPropostaB2B({
      lead: {
        nomeEmpresa: lead.nomeEmpresa,
        cnpj: lead.cnpj,
        responsavel: lead.responsavel,
        tipo: lead.tipo,
        unidades: lead.unidades,
        bairro: lead.bairro,
        precisaMedicao: lead.precisaMedicao,
      },
      valorUnitario: unitario,
      simulacao: simularPropostaVolume({ unidades: lead.unidades, valorUnitario: unitario }),
    });
  }
}
