import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { somenteDigitos } from '../../dominio/cnpj';
import { simularPropostaVolume } from '../../dominio/b2b';
import { PrismaService } from '../../prisma/prisma.service';
import type { AtualizarStatusLeadDto, CriarLeadB2BDto, FiltroLeadsDto, SimularVolumeDto } from './leads-b2b.dto';

const COLUNAS_CRM = ['NOVO', 'EM_CONTATO', 'PROPOSTA_ENVIADA', 'FECHADO'] as const;

@Injectable()
export class LeadsB2BService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async criar(dto: CriarLeadB2BDto, meta: { ip: string | null; userAgent: string | null }) {
    const { site: _honeypot, ...dados } = dto;
    const lead = await this.prisma.leadB2B.create({
      data: { ...dados, cnpj: somenteDigitos(dto.cnpj) },
      select: { id: true, status: true, criadoEm: true },
    });
    await this.audit.registrar({ acao: 'LEAD_B2B_CRIAR', entidade: 'LeadB2B', entidadeId: lead.id, dados: { tipo: dto.tipo, unidades: dto.unidades }, ...meta });
    // Resposta mínima: não ecoa dados pessoais.
    return { id: lead.id, recebidoEm: lead.criadoEm, mensagem: 'Recebemos seu contato. Retornaremos pelo WhatsApp em breve.' };
  }

  simular(dto: SimularVolumeDto) {
    return simularPropostaVolume(dto);
  }

  listar(f: FiltroLeadsDto) {
    return this.prisma.leadB2B.findMany({
      where: { deletadoEm: null, status: f.status, tipo: f.tipo },
      orderBy: { criadoEm: 'desc' },
      include: { responsavelInterno: { select: { id: true, nome: true } } },
      take: 500,
    });
  }

  /** CRM Kanban: Novo → Em contato → Proposta enviada → Fechado. */
  async kanban() {
    const leads = await this.listar({});
    return COLUNAS_CRM.map((status) => ({ status, leads: leads.filter((l) => l.status === status) }));
  }

  async atualizarStatus(id: string, dto: AtualizarStatusLeadDto, usuarioId: string) {
    const lead = await this.prisma.leadB2B.findFirst({ where: { id, deletadoEm: null } });
    if (!lead) throw new NotFoundException('Lead não encontrado.');
    const atualizado = await this.prisma.leadB2B.update({ where: { id }, data: { status: dto.status, responsavelId: dto.responsavelId } });
    await this.audit.registrar({ usuarioId, acao: 'LEAD_B2B_STATUS', entidade: 'LeadB2B', entidadeId: id, dados: { de: lead.status, para: dto.status } });
    return atualizado;
  }
}
