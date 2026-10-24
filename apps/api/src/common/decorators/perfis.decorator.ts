import { SetMetadata } from '@nestjs/common';
import type { PerfilUsuario } from '@prisma/client';

export const CHAVE_PERFIS = 'perfisPermitidos';
/** Restringe a rota aos perfis informados (ADMIN sempre tem acesso). */
export const Perfis = (...perfis: PerfilUsuario[]) => SetMetadata(CHAVE_PERFIS, perfis);
