import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { diaCivil } from '../../dominio/datas';
import { mensagemContextual, normalizarTelefone } from '../../dominio/whatsapp-link';
import { PrismaService } from '../../prisma/prisma.service';
import type { GerarLinkDto } from './whatsapp.dto';
import { WHATSAPP_PROVIDER, type WhatsappProvider } from './whatsapp.provider';

interface Destino {
  telefone: string;
  mensagem: string;
  ordemServicoId?: string;
  clienteId?: string;
  leadB2BId?: string;
}

@Injectable()
export class WhatsappService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(WHATSAPP_PROVIDER) private readonly provider: WhatsappProvider,
  ) {}

  /** Resolve telefone e mensagem contextual a partir da entidade do card. */
  private async resolverDestino(dto: GerarLinkDto): Promise<Destino> {
    if (dto.contexto === 'LIVRE') {
      if (!dto.telefone || !dto.mensagem) throw new BadRequestException('Informe telefone e mensagem no contexto LIVRE.');
      return { telefone: dto.telefone, mensagem: dto.mensagem };
    }
    if (!dto.id) throw new BadRequestException('Informe o id da entidade.');

    switch (dto.contexto) {
      case 'OS': {
        const os = await this.prisma.ordemServico.findFirst({ where: { id: dto.id, deletadoEm: null }, include: { cliente: true } });
        if (!os) throw new NotFoundException('OS não encontrada.');
        return {
          telefone: os.cliente.telefone,
          mensagem:
            dto.mensagem ??
            mensagemContextual({
              tipo: 'OS',
              nomeCliente: os.cliente.nome.split(' ')[0] ?? os.cliente.nome,
              numeroOs: os.numero,
              ambiente: os.ambiente,
              etapa: os.status,
              prazo: os.prazoAcordado ? diaCivil(os.prazoAcordado).split('-').reverse().join('/') : undefined,
            }),
          ordemServicoId: os.id,
          clienteId: os.clienteId,
        };
      }
      case 'CLIENTE': {
        const c = await this.prisma.cliente.findFirst({ where: { id: dto.id, deletadoEm: null } });
        if (!c) throw new NotFoundException('Cliente não encontrado.');
        return { telefone: c.telefone, mensagem: dto.mensagem ?? mensagemContextual({ tipo: 'CLIENTE', nomeCliente: c.nome }), clienteId: c.id };
      }
      case 'LEAD_B2B': {
        const l = await this.prisma.leadB2B.findFirst({ where: { id: dto.id, deletadoEm: null } });
        if (!l) throw new NotFoundException('Lead não encontrado.');
        return {
          telefone: l.whatsapp,
          mensagem: dto.mensagem ?? mensagemContextual({ tipo: 'LEAD_B2B', nomeCliente: l.responsavel, empresa: l.nomeEmpresa }),
          leadB2BId: l.id,
        };
      }
      case 'PROJETO': {
        const p = await this.prisma.projeto.findFirst({ where: { id: dto.id, deletadoEm: null }, include: { cliente: true } });
        if (!p) throw new NotFoundException('Projeto não encontrado.');
        if (!p.cliente) throw new BadRequestException('O projeto não tem cliente vinculado.');
        return {
          telefone: p.cliente.telefone,
          mensagem: dto.mensagem ?? mensagemContextual({ tipo: 'PROJETO', nomeCliente: p.cliente.nome, projeto: p.nome }),
          clienteId: p.cliente.id,
        };
      }
    }
  }

  /** Gera (ou envia, na Fase 2) a mensagem e registra no histórico (RF20). */
  async gerar(dto: GerarLinkDto, usuarioId: string) {
    const destino = await this.resolverDestino(dto);
    let telefone: string;
    try {
      telefone = normalizarTelefone(destino.telefone);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    const envio = await this.provider.enviar(telefone, destino.mensagem);
    const registro = await this.prisma.mensagemWhatsapp.create({
      data: {
        telefone,
        mensagem: destino.mensagem,
        link: envio.link,
        canal: envio.canal,
        status: envio.status,
        contexto: dto.contexto,
        ordemServicoId: destino.ordemServicoId,
        clienteId: destino.clienteId,
        leadB2BId: destino.leadB2BId,
        usuarioId,
      },
    });
    if (dto.contexto === 'OS') {
      await this.audit.registrar({ usuarioId, acao: 'WHATSAPP_ATUALIZACAO_OS', entidade: 'OrdemServico', entidadeId: destino.ordemServicoId });
    }
    return { id: registro.id, link: envio.link, mensagem: destino.mensagem, telefone, canal: envio.canal, status: envio.status };
  }

  historico(filtro: { ordemServicoId?: string; clienteId?: string; leadB2BId?: string }) {
    if (!filtro.ordemServicoId && !filtro.clienteId && !filtro.leadB2BId) {
      throw new BadRequestException('Informe ordemServicoId, clienteId ou leadB2BId.');
    }
    return this.prisma.mensagemWhatsapp.findMany({
      where: filtro,
      orderBy: { criadoEm: 'desc' },
      take: 200,
      include: { usuario: { select: { nome: true } } },
    });
  }
}
