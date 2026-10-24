import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Perfis } from '../../common/decorators/perfis.decorator';
import { UsuarioAtual, type UsuarioAutenticado } from '../../common/decorators/usuario-atual.decorator';
import { ConfirmarPagamentoDto, CriarPagamentoDto, PlanoPadraoDto } from './pagamentos.dto';
import { PagamentosService } from './pagamentos.service';

@ApiTags('pagamentos')
@ApiBearerAuth()
@Perfis('GESTOR', 'COMERCIAL')
@Controller('pagamentos')
export class PagamentosController {
  constructor(private readonly pagamentos: PagamentosService) {}

  @Get()
  listar(@Query('ordemServicoId', new ParseUUIDPipe({ optional: true })) ordemServicoId?: string) {
    return this.pagamentos.listar(ordemServicoId);
  }

  @Post()
  criar(@Body() dto: CriarPagamentoDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.pagamentos.criar(dto, u.sub);
  }

  @Post('plano-padrao/:ordemServicoId')
  planoPadrao(@Param('ordemServicoId', ParseUUIDPipe) id: string, @Body() dto: PlanoPadraoDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.pagamentos.planoPadrao(id, dto, u.sub);
  }

  @Patch(':id/confirmar')
  confirmar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ConfirmarPagamentoDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.pagamentos.confirmar(id, dto, u.sub);
  }

  @Perfis('GESTOR')
  @Patch(':id/cancelar')
  cancelar(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.pagamentos.cancelar(id, u.sub);
  }
}
