import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PerfilUsuario } from '@prisma/client';
import { CHAVE_PERFIS } from '../decorators/perfis.decorator';
import { CHAVE_PUBLICO } from '../decorators/publico.decorator';

/** Autorização por perfil (RBAC). ADMIN tem acesso a tudo. */
@Injectable()
export class PerfisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const alvos = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(CHAVE_PUBLICO, alvos)) return true;
    const perfis = this.reflector.getAllAndOverride<PerfilUsuario[]>(CHAVE_PERFIS, alvos);
    if (!perfis || perfis.length === 0) return true;
    const perfil: PerfilUsuario | undefined = ctx.switchToHttp().getRequest().usuario?.perfil;
    if (perfil === 'ADMIN' || (perfil && perfis.includes(perfil))) return true;
    throw new ForbiddenException('Seu perfil não tem permissão para esta ação.');
  }
}
