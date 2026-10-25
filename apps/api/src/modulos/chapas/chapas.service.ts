import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AjusteEstoqueDto, AtualizarChapaDto, CriarChapaDto } from './chapas.dto';

@Injectable()
export class ChapasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listar(incluirInativas = false) {
    return this.prisma.chapa.findMany({
      where: { deletadoEm: null, ...(incluirInativas ? {} : { ativo: true }) },
      orderBy: [{ material: 'asc' }, { espessuraMm: 'asc' }],
    });
  }

  async obter(id: string) {
    const c = await this.prisma.chapa.findFirst({ where: { id, deletadoEm: null } });
    if (!c) throw new NotFoundException('Chapa não encontrada.');
    return c;
  }

  async criar(dto: CriarChapaDto, usuarioId: string) {
    const chapa = await this.prisma.chapa.create({ data: dto });
    await this.audit.registrar({ usuarioId, acao: 'CHAPA_CRIAR', entidade: 'Chapa', entidadeId: chapa.id });
    return chapa;
  }

  async atualizar(id: string, dto: AtualizarChapaDto, usuarioId: string) {
    const antes = await this.obter(id);
    const chapa = await this.prisma.chapa.update({ where: { id }, data: dto });
    await this.audit.registrar({
      usuarioId,
      acao: 'CHAPA_ATUALIZAR',
      entidade: 'Chapa',
      entidadeId: id,
      dados: { antes: { qtdEstoque: antes.qtdEstoque, custoUnitario: antes.custoUnitario.toString() }, depois: { ...dto } },
    });
    return chapa;
  }

  /** Ajuste atômico de estoque (entrada/baixa) com auditoria. */
  async ajustarEstoque(id: string, dto: AjusteEstoqueDto, usuarioId: string) {
    const chapa = await this.obter(id);
    if (chapa.qtdEstoque + dto.delta < 0) throw new BadRequestException('Estoque não pode ficar negativo.');
    const atualizada = await this.prisma.chapa.update({ where: { id }, data: { qtdEstoque: { increment: dto.delta } } });
    await this.audit.registrar({ usuarioId, acao: 'CHAPA_ESTOQUE', entidade: 'Chapa', entidadeId: id, dados: { delta: dto.delta, motivo: dto.motivo ?? null, saldo: atualizada.qtdEstoque } });
    return atualizada;
  }

  async remover(id: string, usuarioId: string) {
    await this.obter(id);
    await this.prisma.chapa.update({ where: { id }, data: { deletadoEm: new Date(), ativo: false } });
    await this.audit.registrar({ usuarioId, acao: 'CHAPA_REMOVER', entidade: 'Chapa', entidadeId: id });
    return { ok: true };
  }
}
