import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Publico } from '../../common/decorators/publico.decorator';
import { UsuarioAtual, type UsuarioAutenticado } from '../../common/decorators/usuario-atual.decorator';
import { EMPRESA } from '../../dominio/empresa';
import { GerarLinkDto } from './whatsapp.dto';
import { WhatsappService } from './whatsapp.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsapp: WhatsappService) {}

  /** Link oficial (botão flutuante do site). */
  @Publico()
  @Get('oficial')
  oficial() {
    return { numero: EMPRESA.telefone, link: EMPRESA.linkWhatsapp };
  }

  /** Gera link wa.me contextual para card de OS/cliente/lead/projeto e grava no histórico. */
  @ApiBearerAuth()
  @Post('link')
  gerar(@Body() dto: GerarLinkDto, @UsuarioAtual() u: UsuarioAutenticado) {
    return this.whatsapp.gerar(dto, u.sub);
  }

  @ApiBearerAuth()
  @Get('historico')
  historico(@Query('ordemServicoId') ordemServicoId?: string, @Query('clienteId') clienteId?: string, @Query('leadB2BId') leadB2BId?: string) {
    for (const v of [ordemServicoId, clienteId, leadB2BId]) {
      if (v !== undefined && !UUID.test(v)) throw new BadRequestException('Identificador inválido.');
    }
    return this.whatsapp.historico({ ordemServicoId, clienteId, leadB2BId });
  }
}
