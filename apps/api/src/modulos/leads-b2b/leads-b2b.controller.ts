import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Perfis } from '../../common/decorators/perfis.decorator';
import { Publico } from '../../common/decorators/publico.decorator';
import { UsuarioAtual, type UsuarioAutenticado } from '../../common/decorators/usuario-atual.decorator';
import { metaRequisicao } from '../../common/requisicao';
import { AtualizarStatusLeadDto, CriarLeadB2BDto, FiltroLeadsDto, SimularVolumeDto } from './leads-b2b.dto';
import { LeadsB2BService } from './leads-b2b.service';

@ApiTags('leads-b2b')
@Controller('leads-b2b')
export class LeadsB2BController {
  constructor(private readonly leads: LeadsB2BService) {}

  /** Formulário público /empresas — rate limit: 5 envios a cada 10 min por IP. */
  @Publico()
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @Post()
  criar(@Body() dto: CriarLeadB2BDto, @Req() req: Request) {
    return this.leads.criar(dto, metaRequisicao(req));
  }

  /** Calculadora B2B pública (ex.: 20 cozinhas → unitário, total, desconto, prazo). */
  @Publico()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('simular')
  @HttpCode(200)
  simular(@Body() dto: SimularVolumeDto) {
    return this.leads.simular(dto);
  }

  @ApiBearerAuth()
  @Perfis('GESTOR', 'COMERCIAL')
  @Get()
  listar(@Query() f: FiltroLeadsDto) {
    return this.leads.listar(f);
  }

  @ApiBearerAuth()
  @Perfis('GESTOR', 'COMERCIAL')
  @Get('kanban')
  kanban() {
    return this.leads.kanban();
  }

  @ApiBearerAuth()
  @Perfis('GESTOR', 'COMERCIAL')
  @Patch(':id/status')
  atualizarStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarStatusLeadDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.leads.atualizarStatus(id, dto, u.sub);
  }
}
