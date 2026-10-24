import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Perfis } from '../../common/decorators/perfis.decorator';
import { Publico } from '../../common/decorators/publico.decorator';
import { UsuarioAtual, type UsuarioAutenticado } from '../../common/decorators/usuario-atual.decorator';
import { metaRequisicao } from '../../common/requisicao';
import { CriarUsuarioDto, LoginDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Login: 5 tentativas por minuto por IP (proteção contra força bruta). */
  @Publico()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, metaRequisicao(req));
  }

  @ApiBearerAuth()
  @Get('me')
  me(@UsuarioAtual() u: UsuarioAutenticado) {
    return this.auth.perfil(u.sub);
  }

  @ApiBearerAuth()
  @Perfis('GESTOR')
  @Get('usuarios')
  listar() {
    return this.auth.listarUsuarios();
  }

  @ApiBearerAuth()
  @Perfis('ADMIN')
  @Post('usuarios')
  criar(@Body() dto: CriarUsuarioDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.auth.criarUsuario(dto, u.sub);
  }
}
