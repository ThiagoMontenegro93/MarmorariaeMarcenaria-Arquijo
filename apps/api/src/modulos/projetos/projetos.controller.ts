import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { AuditService } from '../../common/audit/audit.service';
import { Perfis } from '../../common/decorators/perfis.decorator';
import { UsuarioAtual, type UsuarioAutenticado } from '../../common/decorators/usuario-atual.decorator';
import { CalculoProjetoService } from './calculo-projeto.service';
import { AtualizarProjetoDto, CriarProjetoDto, SubstituirPecasDto } from './projetos.dto';
import { ProjetosService } from './projetos.service';

export class CalcularProjetoDto {
  /** Sobrescreve a espessura da serra do projeto (padrão 4mm). */
  @IsOptional() @IsInt() @Min(0) @Max(10) espessuraSerraMm?: number;
}

@ApiTags('projetos')
@ApiBearerAuth()
@Perfis('GESTOR', 'COMERCIAL', 'MARCENEIRO')
@Controller('projetos')
export class ProjetosController {
  constructor(
    private readonly projetos: ProjetosService,
    private readonly calculo: CalculoProjetoService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  listar() {
    return this.projetos.listar();
  }

  @Get(':id')
  obter(@Param('id', ParseUUIDPipe) id: string) {
    return this.projetos.obter(id);
  }

  @Post()
  criar(@Body() dto: CriarProjetoDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.projetos.criar(dto, u.sub);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarProjetoDto) {
    return this.projetos.atualizar(id, dto);
  }

  /** RF02 — substitui a cut list. */
  @Put(':id/pecas')
  substituirPecas(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SubstituirPecasDto) {
    return this.projetos.substituirPecas(id, dto.pecas);
  }

  /** RF03/RF04/RF05/RF06 — "Calcular Chapas Necessárias": plano de corte + prévia de custo + lista de compra. */
  @Post(':id/calcular')
  @HttpCode(200)
  async calcular(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CalcularProjetoDto, @UsuarioAtual() u: UsuarioAutenticado) {
    const r = await this.calculo.calcular(id, dto);
    await this.audit.registrar({
      usuarioId: u.sub,
      acao: 'PROJETO_CALCULAR',
      entidade: 'Projeto',
      entidadeId: id,
      dados: { totalChapas: r.resultado.totalChapas, valorFinal: r.previa.valorFinal, duracaoMs: r.duracaoMs },
    });
    return r;
  }

  @Perfis('GESTOR')
  @Delete(':id')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.projetos.remover(id, u.sub);
  }
}
