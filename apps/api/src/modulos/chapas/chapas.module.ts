import { Module } from '@nestjs/common';
import { ChapasController } from './chapas.controller';
import { ChapasService } from './chapas.service';

@Module({ controllers: [ChapasController], providers: [ChapasService], exports: [ChapasService] })
export class ChapasModule {}
