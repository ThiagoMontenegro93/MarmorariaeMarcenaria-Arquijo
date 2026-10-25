import { Controller, Get, Param, ParseUUIDPipe, Query, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { AuditService } from '../../common/audit/audit.service';
import { Perfis } from '../../common/decorators/perfis.decorator';
import { UsuarioAtual, type UsuarioAutenticado } from '../../common/decorators/usuario-atual.decorator';
import { PdfService } from './pdf.service';

export class PropostaQueryDto {
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) valorUnitario?: number;
}

function arquivo(pdf: Buffer, nome: string): StreamableFile {
  return new StreamableFile(pdf, { type: 'application/pdf', disposition: `attachment; filename="${nome}.pdf"`, length: pdf.length });
}

/** Exportação PDF (RF24): orçamento, OS, proposta B2B e lista de compra. */
@ApiTags('pdf')
@ApiBearerAuth()
@ApiProduces('application/pdf')
@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdf: PdfService,
    private readonly audit: AuditService,
  ) {}

  @Perfis('GESTOR', 'COMERCIAL', 'MARCENEIRO')
  @Get('projetos/:id/orcamento')
  async orcamento(@Param('id', ParseUUIDPipe) id: string) {
    return arquivo(await this.pdf.orcamentoProjeto(id), `orcamento-${id.slice(0, 8)}`);
  }

  @Perfis('GESTOR', 'COMERCIAL', 'MARCENEIRO')
  @Get('projetos/:id/lista-compra')
  async listaCompra(@Param('id', ParseUUIDPipe) id: string) {
    return arquivo(await this.pdf.listaCompra(id), `lista-compra-${id.slice(0, 8)}`);
  }

  @Get('ordens-servico/:id')
  async ordemServico(@Param('id', ParseUUIDPipe) id: string) {
    const r = await this.pdf.ordemServico(id);
    return arquivo(r.pdf, r.nome);
  }

  @Perfis('GESTOR', 'COMERCIAL')
  @Get('leads-b2b/:id/proposta')
  async proposta(@Param('id', ParseUUIDPipe) id: string, @Query() q: PropostaQueryDto, @UsuarioAtual() u: UsuarioAutenticado) {
    const pdf = await this.pdf.propostaB2B(id, q.valorUnitario);
    await this.audit.registrar({ usuarioId: u.sub, acao: 'PDF_PROPOSTA_B2B', entidade: 'LeadB2B', entidadeId: id });
    return arquivo(pdf, `proposta-${id.slice(0, 8)}`);
  }
}
