import type { Request } from 'express';

/** Metadados da requisição para a auditoria. */
export function metaRequisicao(req: Request): { ip: string | null; userAgent: string | null } {
  return { ip: req.ip ?? null, userAgent: (req.headers['user-agent'] as string | undefined) ?? null };
}
