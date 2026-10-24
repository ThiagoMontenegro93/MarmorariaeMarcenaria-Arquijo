import { Module } from '@nestjs/common';
import { CalculoProjetoService } from './calculo-projeto.service';
import { ProjetosController } from './projetos.controller';
import { ProjetosService } from './projetos.service';

@Module({
  controllers: [ProjetosController],
  providers: [ProjetosService, CalculoProjetoService],
  exports: [CalculoProjetoService],
})
export class ProjetosModule {}
