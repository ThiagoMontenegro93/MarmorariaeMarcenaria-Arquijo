import { Module } from '@nestjs/common';
import { ProjetosModule } from '../projetos/projetos.module';
import { OrdensServicoController } from './ordens-servico.controller';
import { OrdensServicoService } from './ordens-servico.service';

@Module({ imports: [ProjetosModule], controllers: [OrdensServicoController], providers: [OrdensServicoService] })
export class OrdensServicoModule {}
