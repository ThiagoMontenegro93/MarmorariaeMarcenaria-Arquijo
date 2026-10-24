import { Body, Controller, Delete, Get, Param, ParseBoolPipe, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Perfis } from '../../common/decorators/perfis.decorator';
import { UsuarioAtual, type UsuarioAutenticado } from '../../common/decorators/usuario-atual.decorator';
import { AjusteEstoqueDto, AtualizarChapaDto, CriarChapaDto } from './chapas.dto';
import { ChapasService } from './chapas.service';

@ApiTags('chapas')
@ApiBearerAuth()
@Controller('chapas')
export class ChapasController {
  constructor(private readonly chapas: ChapasService) {}

  /** RF01 — todos os perfis internos consultam chapas e estoque. */
  @Get()
  listar(@Query('incluirInativas', new ParseBoolPipe({ optional: true })) incluirInativas?: boolean) {
    return this.chapas.listar(incluirInativas ?? false);
  }

  @Get(':id')
  obter(@Param('id', ParseUUIDPipe) id: string) {
    return this.chapas.obter(id);
  }

  @Perfis('GESTOR')
  @Post()
  criar(@Body() dto: CriarChapaDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.chapas.criar(dto, u.sub);
  }

  @Perfis('GESTOR')
  @Patch(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarChapaDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.chapas.atualizar(id, dto, u.sub);
  }

  @Perfis('GESTOR', 'MARCENEIRO')
  @Post(':id/estoque')
  ajustarEstoque(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AjusteEstoqueDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.chapas.ajustarEstoque(id, dto, u.sub);
  }

  @Perfis('GESTOR')
  @Delete(':id')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.chapas.remover(id, u.sub);
  }
}
