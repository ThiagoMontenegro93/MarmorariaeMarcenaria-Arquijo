import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Publico } from '../../common/decorators/publico.decorator';
import { FiltroModelosDto, FiltroObrasDto, QuizDto } from './catalogo.dto';
import { CatalogoService } from './catalogo.service';

@ApiTags('catalogo (público)')
@Publico()
@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  /** Dados de contato / Google Meu Negócio (RF23). */
  @Get('empresa')
  empresa() {
    return this.catalogo.empresa();
  }

  @Get('colecoes')
  colecoes() {
    return this.catalogo.colecoes();
  }

  @Get('colecoes/:slug')
  colecao(@Param('slug') slug: string) {
    return this.catalogo.colecao(slug);
  }

  @Get('modelos')
  modelos(@Query() f: FiltroModelosDto) {
    return this.catalogo.modelos(f);
  }

  @Get('modelos/:slug')
  modelo(@Param('slug') slug: string) {
    return this.catalogo.modelo(slug);
  }

  @Get('combos')
  combos() {
    return this.catalogo.combos();
  }

  @Get('obras')
  obras(@Query() f: FiltroObrasDto) {
    return this.catalogo.obras(f);
  }

  @Get('obras/:slug')
  obra(@Param('slug') slug: string) {
    return this.catalogo.obra(slug);
  }

  @Post('quiz')
  @HttpCode(200)
  quiz(@Body() dto: QuizDto) {
    return this.catalogo.quiz(dto);
  }
}
