import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PerfilUsuario } from '@prisma/client';

/** Conteúdo do JWT após validação. */
export interface UsuarioAutenticado {
  sub: string;
  email: string;
  nome: string;
  perfil: PerfilUsuario;
}

export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, ctx: ExecutionContext): UsuarioAutenticado | undefined => ctx.switchToHttp().getRequest().usuario,
);
