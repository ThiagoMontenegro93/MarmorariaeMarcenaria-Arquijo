import { Module } from '@nestjs/common';
import { MedicoesController } from './medicoes.controller';
import { MedicoesService } from './medicoes.service';

@Module({ controllers: [MedicoesController], providers: [MedicoesService] })
export class MedicoesModule {}
