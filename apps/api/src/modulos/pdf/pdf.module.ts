import { Module } from '@nestjs/common';
import { ProjetosModule } from '../projetos/projetos.module';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';

@Module({ imports: [ProjetosModule], controllers: [PdfController], providers: [PdfService] })
export class PdfModule {}
