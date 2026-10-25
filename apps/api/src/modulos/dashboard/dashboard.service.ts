import { Injectable } from '@nestjs/common';
import { num } from '../../common/numero';
import { montarFunil, resumirFluxoCaixa } from '../../dominio/dashboard';
import { diaCivil } from '../../dominio/datas';
import { ETAPAS_POS_ENTREGA, calcularAtrasoDias } from '../../dominio/os-fluxo';
import { PrismaService } from '../../prisma/prisma.service';

const DIA_MS = 86_400_000;

/** Dashboard ponta a ponta (Módulo D): KPIs, funil, fluxo de caixa e "precisa de atenção hoje". */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async kpis(hoje = new Date()) {
    const inicioMes = new Date(`${diaCivil(hoje).slice(0, 7)}-01T00:00:00-03:00`);
    const [orcMes, emProducao, aReceber, entregues] = await Promise.all([
      this.prisma.ordemServico.aggregate({ where: { deletadoEm: null, dataOrcamento: { gte: inicioMes } }, _count: true, _sum: { valorTotal: true } }),
      this.prisma.ordemServico.count({ where: { deletadoEm: null, status: 'PRODUCAO' } }),
      this.prisma.pagamento.aggregate({ where: { status: 'PENDENTE', ordemServico: { deletadoEm: null } }, _sum: { valor: true } }),
      this.prisma.ordemServico.findMany({
        where: { deletadoEm: null, prazoReal: { not: null }, prazoAcordado: { not: null } },
        select: { prazoAcordado: true, prazoReal: true },
      }),
    ]);
    const noPrazo = entregues.filter((o) => calcularAtrasoDias(o.prazoAcordado, o.prazoReal, hoje) === 0).length;
    return {
      orcamentosMes: { quantidade: orcMes._count, valor: num(orcMes._sum.valorTotal) },
      osEmProducao: emProducao,
      valorAReceber: num(aReceber._sum.valor),
      entregasNoPrazoPct: entregues.length ? Math.round((noPrazo / entregues.length) * 10000) / 100 : null,
    };
  }

  async funil() {
    const ordens = await this.prisma.ordemServico.findMany({ where: { deletadoEm: null }, select: { status: true, valorTotal: true } });
    return montarFunil(ordens.map((o) => ({ status: o.status, valorTotal: num(o.valorTotal) })));
  }

  async fluxoCaixa(hoje = new Date()) {
    const pagamentos = await this.prisma.pagamento.findMany({
      where: { ordemServico: { deletadoEm: null } },
      select: { valor: true, status: true, forma: true, pagoEm: true, vencimento: true },
    });
    return resumirFluxoCaixa(pagamentos.map((p) => ({ ...p, valor: num(p.valor) })), hoje);
  }

  async atencaoHoje(hoje = new Date()) {
    const hojeDia = diaCivil(hoje);
    const inicioHoje = new Date(`${hojeDia}T00:00:00-03:00`);
    const fimHoje = new Date(inicioHoje.getTime() + DIA_MS);

    const [atrasadas, pagamentosVencidos, medicoesHoje, enviadas] = await Promise.all([
      this.prisma.ordemServico.findMany({
        where: { deletadoEm: null, prazoAcordado: { lt: inicioHoje }, status: { notIn: [...ETAPAS_POS_ENTREGA] } },
        select: { id: true, numero: true, ambiente: true, prioridade: true, prazoAcordado: true, cliente: { select: { nome: true } } },
        orderBy: { prazoAcordado: 'asc' },
      }),
      this.prisma.pagamento.findMany({
        where: { status: 'PENDENTE', vencimento: { lt: new Date(inicioHoje.getTime() - 7 * DIA_MS) }, ordemServico: { deletadoEm: null } },
        select: { id: true, valor: true, vencimento: true, ordemServico: { select: { id: true, numero: true, cliente: { select: { nome: true } } } } },
        orderBy: { vencimento: 'asc' },
      }),
      this.prisma.ordemServico.findMany({
        where: { deletadoEm: null, dataMedicao: { gte: inicioHoje, lt: fimHoje } },
        select: { id: true, numero: true, ambiente: true, dataMedicao: true, cliente: { select: { nome: true } } },
      }),
      // Último contato enviado por cliente; sem resposta registrada há mais de 2 dias.
      this.prisma.mensagemWhatsapp.findMany({
        where: { clienteId: { not: null } },
        orderBy: { criadoEm: 'desc' },
        distinct: ['clienteId'],
        select: { clienteId: true, direcao: true, criadoEm: true, cliente: { select: { nome: true } } },
        take: 500,
      }),
    ]);

    const limiteSemResposta = new Date(hoje.getTime() - 2 * DIA_MS);
    return {
      osAtrasadas: atrasadas.map((o) => ({ ...o, codigo: `OS-${o.numero}`, atrasoDias: calcularAtrasoDias(o.prazoAcordado, null, hoje) })),
      pagamentosPendentesMais7Dias: pagamentosVencidos.map((p) => ({ ...p, valor: num(p.valor) })),
      medicoesHoje,
      clientesSemRespostaWhatsapp2Dias: enviadas
        .filter((m) => m.direcao === 'ENVIADA' && m.criadoEm < limiteSemResposta)
        .map((m) => ({ clienteId: m.clienteId, nome: m.cliente?.nome, ultimoEnvio: m.criadoEm })),
    };
  }

  async resumo() {
    const hoje = new Date();
    const [kpis, funil, fluxoCaixa, atencaoHoje] = await Promise.all([this.kpis(hoje), this.funil(), this.fluxoCaixa(hoje), this.atencaoHoje(hoje)]);
    return { geradoEm: hoje, kpis, funil, fluxoCaixa, atencaoHoje };
  }
}
