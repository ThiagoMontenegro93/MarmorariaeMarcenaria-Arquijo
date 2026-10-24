import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { paginar } from '../../common/dto/paginacao.dto';
import { PrismaService } from '../../prisma/prisma.service';
import type { AtualizarClienteDto, CriarClienteDto, FiltroClientesDto } from './clientes.dto';

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listar(f: FiltroClientesDto) {
    const where: Prisma.ClienteWhereInput = {
      deletadoEm: null,
      ...(f.busca ? { OR: [{ nome: { contains: f.busca, mode: 'insensitive' } }, { telefone: { contains: f.busca } }] } : {}),
    };
    const [itens, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({ where, orderBy: { nome: 'asc' }, ...paginar(f) }),
      this.prisma.cliente.count({ where }),
    ]);
    return { itens, total, pagina: f.pagina, porPagina: f.porPagina };
  }

  async obter(id: string) {
    const c = await this.prisma.cliente.findFirst({ where: { id, deletadoEm: null } });
    if (!c) throw new NotFoundException('Cliente não encontrado.');
    return c;
  }

  async criar(dto: CriarClienteDto, usuarioId: string) {
    const cliente = await this.prisma.cliente.create({
      data: { ...dto, consentimentoEm: dto.consentimentoLgpd ? new Date() : null },
    });
    await this.audit.registrar({ usuarioId, acao: 'CLIENTE_CRIAR', entidade: 'Cliente', entidadeId: cliente.id, dados: { consentimentoLgpd: dto.consentimentoLgpd } });
    return cliente;
  }

  async atualizar(id: string, dto: AtualizarClienteDto, usuarioId: string) {
    const atual = await this.obter(id);
    const mudouConsentimento = dto.consentimentoLgpd !== undefined && dto.consentimentoLgpd !== atual.consentimentoLgpd;
    const cliente = await this.prisma.cliente.update({
      where: { id },
      data: { ...dto, ...(mudouConsentimento ? { consentimentoEm: dto.consentimentoLgpd ? new Date() : null } : {}) },
    });
    if (mudouConsentimento) {
      await this.audit.registrar({ usuarioId, acao: 'CLIENTE_CONSENTIMENTO', entidade: 'Cliente', entidadeId: id, dados: { consentimentoLgpd: dto.consentimentoLgpd ?? null } });
    }
    return cliente;
  }

  /**
   * Exclusão LGPD: soft delete + anonimização dos dados pessoais.
   * O histórico financeiro/OS permanece para obrigações fiscais, sem identificar o titular.
   */
  async remover(id: string, usuarioId: string) {
    await this.obter(id);
    await this.prisma.cliente.update({
      where: { id },
      data: {
        nome: 'Cliente anonimizado',
        telefone: '00000000000',
        email: null,
        documento: null,
        endereco: null,
        observacoes: null,
        consentimentoLgpd: false,
        deletadoEm: new Date(),
      },
    });
    await this.audit.registrar({ usuarioId, acao: 'CLIENTE_ANONIMIZAR', entidade: 'Cliente', entidadeId: id });
    return { ok: true };
  }
}
