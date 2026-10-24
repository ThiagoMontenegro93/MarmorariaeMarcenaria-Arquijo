import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AtualizarProjetoDto, CriarProjetoDto, PecaDto } from './projetos.dto';

@Injectable()
export class ProjetosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listar() {
    return this.prisma.projeto.findMany({
      where: { deletadoEm: null },
      orderBy: { atualizadoEm: 'desc' },
      include: { cliente: { select: { id: true, nome: true } }, _count: { select: { pecas: true } } },
      take: 200,
    });
  }

  async obter(id: string) {
    const p = await this.prisma.projeto.findFirst({
      where: { id, deletadoEm: null },
      include: { pecas: { include: { chapa: { select: { id: true, nome: true } } } }, cliente: true, modelo: true },
    });
    if (!p) throw new NotFoundException('Projeto não encontrado.');
    return p;
  }

  private dadosPecas(pecas: PecaDto[]): Prisma.PecaCreateManyProjetoInput[] {
    return pecas.map((p) => ({ nome: p.nome, larguraMm: p.larguraMm, alturaMm: p.alturaMm, quantidade: p.quantidade, chapaId: p.chapaId, veio: p.veio }));
  }

  async criar(dto: CriarProjetoDto, usuarioId: string) {
    const { pecas, ferragens, ...resto } = dto;
    const projeto = await this.prisma.projeto.create({
      data: {
        ...resto,
        ferragens: (ferragens ?? []) as unknown as Prisma.InputJsonValue,
        criadoPorId: usuarioId,
        pecas: { createMany: { data: this.dadosPecas(pecas) } },
      },
      include: { pecas: true },
    });
    await this.audit.registrar({ usuarioId, acao: 'PROJETO_CRIAR', entidade: 'Projeto', entidadeId: projeto.id });
    return projeto;
  }

  async atualizar(id: string, dto: AtualizarProjetoDto) {
    await this.obter(id);
    const { ferragens, ...resto } = dto;
    return this.prisma.projeto.update({
      where: { id },
      data: { ...resto, ...(ferragens ? { ferragens: ferragens as unknown as Prisma.InputJsonValue } : {}) },
    });
  }

  /** Substitui a cut list inteira (transação) e invalida o último cálculo. */
  async substituirPecas(id: string, pecas: PecaDto[]) {
    await this.obter(id);
    await this.prisma.$transaction([
      this.prisma.peca.deleteMany({ where: { projetoId: id } }),
      this.prisma.peca.createMany({ data: this.dadosPecas(pecas).map((p) => ({ ...p, projetoId: id })) }),
      this.prisma.projeto.update({ where: { id }, data: { resultadoCalculo: Prisma.DbNull, previaCusto: Prisma.DbNull, calculadoEm: null } }),
    ]);
    return this.obter(id);
  }

  async remover(id: string, usuarioId: string) {
    await this.obter(id);
    await this.prisma.projeto.update({ where: { id }, data: { deletadoEm: new Date() } });
    await this.audit.registrar({ usuarioId, acao: 'PROJETO_REMOVER', entidade: 'Projeto', entidadeId: id });
    return { ok: true };
  }
}
