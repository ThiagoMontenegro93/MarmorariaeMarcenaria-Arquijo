import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Perfis } from '../../common/decorators/perfis.decorator';
import { UsuarioAtual, type UsuarioAutenticado } from '../../common/decorators/usuario-atual.decorator';
import { AtualizarOrdemServicoDto, AvancarEtapaDto, CriarOrdemServicoDto, FiltroOrdensDto } from './ordens-servico.dto';
import { OrdensServicoService } from './ordens-servico.service';

@ApiTags('ordens-servico')
@ApiBearerAuth()
@Controller('ordens-servico')
export class OrdensServicoController {
  constructor(private readonly os: OrdensServicoService) {}

  @Get()
  listar(@Query() f: FiltroOrdensDto) {
    return this.os.listar(f);
  }

  @Get('kanban')
  kanban() {
    return this.os.kanban();
  }

  @Get('gantt')
  gantt() {
    return this.os.gantt();
  }

  @Get(':id')
  obter(@Param('id', ParseUUIDPipe) id: string) {
    return this.os.obter(id);
  }

  @Perfis('GESTOR', 'COMERCIAL')
  @Post()
  criar(@Body() dto: CriarOrdemServicoDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.os.criar(dto, u.sub);
  }

  @Perfis('GESTOR', 'COMERCIAL')
  @Patch(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarOrdemServicoDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.os.atualizar(id, dto, u.sub);
  }

  /** "Mover para a próxima etapa" — marceneiro também avança (medição, produção, instalação). */
  @Perfis('GESTOR', 'COMERCIAL', 'MARCENEIRO')
  @Patch(':id/avancar')
  avancar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AvancarEtapaDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.os.avancar(id, u.sub, dto.observacao);
  }

  @Perfis('GESTOR')
  @Delete(':id')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.os.remover(id, u.sub);
  }
}
