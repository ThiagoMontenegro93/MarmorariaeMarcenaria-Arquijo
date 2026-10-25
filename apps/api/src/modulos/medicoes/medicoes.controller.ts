import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, StreamableFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MAX_FOTOS_POR_MEDICAO, TAMANHO_MAX_FOTO, chaveValida } from '../../armazenamento/armazenamento';
import { Perfis } from '../../common/decorators/perfis.decorator';
import { UsuarioAtual, type UsuarioAutenticado } from '../../common/decorators/usuario-atual.decorator';
import { MedicoesService, type FotoRecebida } from './medicoes.service';

@ApiTags('medicoes')
@ApiBearerAuth()
@Perfis('GESTOR', 'COMERCIAL', 'MARCENEIRO')
@Controller()
export class MedicoesController {
  constructor(private readonly medicoes: MedicoesService) {}

  /**
   * Recebe a medição do PWA (multipart: campo "dados" em JSON + até 6 "fotos").
   * Idempotente pelo idLocal: a sincronização pode reenviar sem duplicar.
   */
  @Post('ordens-servico/:id/medicoes')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('fotos', MAX_FOTOS_POR_MEDICAO, { limits: { fileSize: TAMANHO_MAX_FOTO, files: MAX_FOTOS_POR_MEDICAO, fields: 5 } }))
  registrar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('dados') dados: string,
    @UploadedFiles() fotos: FotoRecebida[] | undefined,
    @UsuarioAtual() u: UsuarioAutenticado,
  ) {
    return this.medicoes.registrar(id, dados, fotos ?? [], u.sub);
  }

  @Get('ordens-servico/:id/medicoes')
  listar(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicoes.listar(id);
  }

  /** Fotos das medições (somente usuários autenticados). */
  @Get('arquivos/:pasta/:nome')
  async arquivo(@Param('pasta') pasta: string, @Param('nome') nome: string) {
    const chave = `${pasta}/${nome}`;
    if (!chaveValida(chave)) throw new NotFoundException('Arquivo não encontrado.');
    try {
      const a = await this.medicoes.lerArquivo(chave);
      return new StreamableFile(a.conteudo, { type: a.tipo, disposition: 'inline' });
    } catch {
      throw new NotFoundException('Arquivo não encontrado.');
    }
  }
}
