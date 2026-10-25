import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Perfis } from '../../common/decorators/perfis.decorator';
import { UsuarioAtual, type UsuarioAutenticado } from '../../common/decorators/usuario-atual.decorator';
import { AtualizarClienteDto, CriarClienteDto, FiltroClientesDto } from './clientes.dto';
import { ClientesService } from './clientes.service';

@ApiTags('clientes')
@ApiBearerAuth()
@Perfis('GESTOR', 'COMERCIAL')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientes: ClientesService) {}

  @Get()
  listar(@Query() f: FiltroClientesDto) {
    return this.clientes.listar(f);
  }

  @Get(':id')
  obter(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientes.obter(id);
  }

  @Post()
  criar(@Body() dto: CriarClienteDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.clientes.criar(dto, u.sub);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarClienteDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.clientes.atualizar(id, dto, u.sub);
  }

  /** Exclusão a pedido do titular (LGPD): anonimiza. */
  @Perfis('GESTOR')
  @Delete(':id')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.clientes.remover(id, u.sub);
  }
}
