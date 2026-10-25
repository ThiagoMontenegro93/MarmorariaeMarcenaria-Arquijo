import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ARMAZENAMENTO, MAX_FOTOS_POR_MEDICAO, tipoPorAssinatura, validarFoto, type Armazenamento } from '../../armazenamento/armazenamento';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MedicaoDto } from './medicoes.dto';

export interface FotoRecebida {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class MedicoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(ARMAZENAMENTO) private readonly armazenamento: Armazenamento,
  ) {}

  /** Converte e valida o JSON do campo "dados" com as mesmas regras dos demais DTOs. */
  async validarDados(bruto: unknown): Promise<MedicaoDto> {
    let obj: unknown = bruto;
    if (typeof bruto === 'string') {
      try {
        obj = JSON.parse(bruto);
      } catch {
        throw new BadRequestException('Campo "dados" deve ser JSON.');
      }
    }
    const dto = plainToInstance(MedicaoDto, obj);
    const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (erros.length) {
      const msgs = erros.flatMap((e) => Object.values(e.constraints ?? {}).concat((e.children ?? []).flatMap((c) => c.children?.flatMap((cc) => Object.values(cc.constraints ?? {})) ?? [])));
      throw new BadRequestException(msgs.length ? msgs : 'Dados de medição inválidos.');
    }
    return dto;
  }

  /** Registra a medição (idempotente por idLocal) e grava as fotos no armazenamento. */
  async registrar(ordemServicoId: string, bruto: unknown, fotos: FotoRecebida[], usuarioId: string) {
    const dto = await this.validarDados(bruto);
    const os = await this.prisma.ordemServico.findFirst({ where: { id: ordemServicoId, deletadoEm: null }, select: { id: true, numero: true } });
    if (!os) throw new NotFoundException('Ordem de serviço não encontrada.');

    const existente = await this.prisma.medicao.findUnique({ where: { idLocal: dto.idLocal } });
    if (existente) {
      if (existente.ordemServicoId !== ordemServicoId) throw new BadRequestException('idLocal já usado em outra OS.');
      return { ...existente, duplicada: true };
    }

    if (fotos.length > MAX_FOTOS_POR_MEDICAO) throw new BadRequestException(`Máximo de ${MAX_FOTOS_POR_MEDICAO} fotos.`);
    for (const f of fotos) {
      const erro = validarFoto(f.mimetype, f.size);
      if (erro) throw new BadRequestException(erro);
      if (tipoPorAssinatura(f.buffer) !== f.mimetype) throw new BadRequestException('O conteúdo da foto não corresponde ao tipo informado.');
    }
    const chaves: string[] = [];
    for (const f of fotos) chaves.push((await this.armazenamento.salvar('medicoes', f.buffer, f.mimetype)).chave);

    const medicao = await this.prisma.medicao.create({
      data: {
        idLocal: dto.idLocal,
        ordemServicoId,
        usuarioId,
        ambiente: dto.ambiente,
        paredes: dto.paredes as unknown as Prisma.InputJsonValue,
        observacoes: dto.observacoes,
        fotos: chaves,
        medidoEm: new Date(dto.medidoEm),
      },
    });
    await this.audit.registrar({ usuarioId, acao: 'MEDICAO_REGISTRAR', entidade: 'OrdemServico', entidadeId: ordemServicoId, dados: { medicaoId: medicao.id, fotos: chaves.length } });
    return { ...medicao, duplicada: false };
  }

  listar(ordemServicoId: string) {
    return this.prisma.medicao.findMany({ where: { ordemServicoId }, orderBy: { medidoEm: 'desc' }, include: { usuario: { select: { nome: true } } } });
  }

  lerArquivo(chave: string) {
    return this.armazenamento.ler(chave);
  }
}
