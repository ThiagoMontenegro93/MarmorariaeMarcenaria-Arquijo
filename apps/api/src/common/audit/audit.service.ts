import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface RegistroAuditoria {
  usuarioId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  dados?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Trilha de auditoria de ações críticas (login, OS, pagamentos, estoque, leads...).
 * Falha ao gravar a auditoria é logada, mas não derruba a operação de negócio.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('Auditoria');

  constructor(private readonly prisma: PrismaService) {}

  async registrar(r: RegistroAuditoria): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          usuarioId: r.usuarioId ?? null,
          acao: r.acao,
          entidade: r.entidade,
          entidadeId: r.entidadeId ?? null,
          dados: r.dados,
          ip: r.ip?.slice(0, 64) ?? null,
          userAgent: r.userAgent?.slice(0, 255) ?? null,
        },
      });
    } catch (e) {
      this.logger.error(`Falha ao registrar auditoria ${r.acao}: ${(e as Error).message}`);
    }
  }
}
