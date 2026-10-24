import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { num } from '../../common/numero';
import { calcularStatusFinanceiro, valorEntradaPadrao } from '../../dominio/os-fluxo';
import { PrismaService } from '../../prisma/prisma.service';
import type { ConfirmarPagamentoDto, CriarPagamentoDto, PlanoPadraoDto } from './pagamentos.dto';

const arred2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

/** Financeiro por OS (RF15): entrada 50% + saldo, status Pendente/Parcial/Pago. */
@Injectable()
export class PagamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listar(ordemServicoId?: string) {
    return this.prisma.pagamento.findMany({
      where: { ordemServicoId },
      orderBy: [{ vencimento: { sort: 'asc', nulls: 'last' } }, { criadoEm: 'asc' }],
      include: { ordemServico: { select: { numero: true, cliente: { select: { nome: true } } } } },
      take: 500,
    });
  }

  private async obterOs(id: string) {
    const os = await this.prisma.ordemServico.findFirst({ where: { id, deletadoEm: null }, include: { pagamentos: true } });
    if (!os) throw new NotFoundException('Ordem de serviço não encontrada.');
    return os;
  }

  /** Recalcula valor recebido e status financeiro da OS a partir dos pagamentos PAGOS. */
  private async recalcularOs(tx: Prisma.TransactionClient, ordemServicoId: string) {
    const os = await tx.ordemServico.findUniqueOrThrow({ where: { id: ordemServicoId }, include: { pagamentos: true } });
    const recebido = arred2(os.pagamentos.filter((p) => p.status === 'PAGO').reduce((s, p) => s + num(p.valor), 0));
    await tx.ordemServico.update({
      where: { id: ordemServicoId },
      data: { valorRecebido: recebido, statusFinanceiro: calcularStatusFinanceiro(num(os.valorTotal), recebido) },
    });
  }

  async criar(dto: CriarPagamentoDto, usuarioId: string) {
    const os = await this.obterOs(dto.ordemServicoId);
    const comprometido = os.pagamentos.filter((p) => p.status !== 'CANCELADO').reduce((s, p) => s + num(p.valor), 0);
    if (comprometido + dto.valor > num(os.valorTotal) + 0.009) {
      throw new BadRequestException(`Pagamentos excedem o valor da OS (R$ ${num(os.valorTotal).toFixed(2)}).`);
    }
    const pagamento = await this.prisma.$transaction(async (tx) => {
      const p = await tx.pagamento.create({
        data: {
          ordemServicoId: dto.ordemServicoId,
          tipo: dto.tipo,
          forma: dto.forma,
          valor: dto.valor,
          parcelas: dto.parcelas ?? 1,
          vencimento: dto.vencimento ? new Date(dto.vencimento) : undefined,
          status: dto.pago ? 'PAGO' : 'PENDENTE',
          pagoEm: dto.pago ? new Date() : undefined,
          observacao: dto.observacao,
          registradoPor: usuarioId,
        },
      });
      await this.recalcularOs(tx, dto.ordemServicoId);
      return p;
    });
    await this.audit.registrar({ usuarioId, acao: 'PAGAMENTO_REGISTRAR', entidade: 'Pagamento', entidadeId: pagamento.id, dados: { os: os.numero, valor: dto.valor, forma: dto.forma, pago: !!dto.pago } });
    return pagamento;
  }

  /** Cria o plano padrão: entrada de 50% (hoje) + saldo (no prazo acordado). */
  async planoPadrao(ordemServicoId: string, dto: PlanoPadraoDto, usuarioId: string) {
    const os = await this.obterOs(ordemServicoId);
    if (os.pagamentos.some((p) => p.status !== 'CANCELADO')) throw new BadRequestException('A OS já possui pagamentos registrados.');
    const total = num(os.valorTotal);
    if (total <= 0) throw new BadRequestException('Defina o valor total da OS antes de gerar o plano de pagamento.');
    const entrada = valorEntradaPadrao(total);
    const saldo = arred2(total - entrada);
    const vencSaldo = dto.vencimentoSaldo ? new Date(dto.vencimentoSaldo) : os.prazoAcordado;

    await this.prisma.pagamento.createMany({
      data: [
        { ordemServicoId, tipo: 'ENTRADA', forma: dto.forma, valor: entrada, vencimento: new Date(), registradoPor: usuarioId },
        { ordemServicoId, tipo: 'PARCELA', forma: dto.forma, valor: saldo, vencimento: vencSaldo, registradoPor: usuarioId },
      ],
    });
    await this.audit.registrar({ usuarioId, acao: 'PAGAMENTO_PLANO_PADRAO', entidade: 'OrdemServico', entidadeId: ordemServicoId, dados: { entrada, saldo } });
    return this.listar(ordemServicoId);
  }

  async confirmar(id: string, dto: ConfirmarPagamentoDto, usuarioId: string) {
    const p = await this.prisma.pagamento.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Pagamento não encontrado.');
    if (p.status !== 'PENDENTE') throw new BadRequestException(`Pagamento já está ${p.status}.`);
    const atualizado = await this.prisma.$transaction(async (tx) => {
      const r = await tx.pagamento.update({
        where: { id },
        data: { status: 'PAGO', pagoEm: dto.pagoEm ? new Date(dto.pagoEm) : new Date(), forma: dto.forma },
      });
      await this.recalcularOs(tx, p.ordemServicoId);
      return r;
    });
    await this.audit.registrar({ usuarioId, acao: 'PAGAMENTO_CONFIRMAR', entidade: 'Pagamento', entidadeId: id, dados: { valor: num(p.valor) } });
    return atualizado;
  }

  async cancelar(id: string, usuarioId: string) {
    const p = await this.prisma.pagamento.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Pagamento não encontrado.');
    if (p.status === 'CANCELADO') return p;
    const r = await this.prisma.$transaction(async (tx) => {
      const c = await tx.pagamento.update({ where: { id }, data: { status: 'CANCELADO' } });
      await this.recalcularOs(tx, p.ordemServicoId);
      return c;
    });
    await this.audit.registrar({ usuarioId, acao: 'PAGAMENTO_CANCELAR', entidade: 'Pagamento', entidadeId: id, dados: { statusAnterior: p.status, valor: num(p.valor) } });
    return r;
  }
}
