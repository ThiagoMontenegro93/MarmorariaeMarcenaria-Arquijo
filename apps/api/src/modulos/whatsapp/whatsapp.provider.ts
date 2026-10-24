import { Injectable, Logger, NotImplementedException, ServiceUnavailableException } from '@nestjs/common';
import { gerarLinkWhatsApp } from '../../dominio/whatsapp-link';

/** Token de injeção do provedor de envio. */
export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');

export interface ResultadoEnvio {
  canal: 'LINK_WA_ME' | 'BUSINESS_API';
  status: 'GERADA' | 'ENVIADA' | 'FALHA';
  /** Link wa.me para o usuário abrir (canal LINK_WA_ME). */
  link?: string;
  idExterno?: string;
}

/**
 * Contrato de envio de WhatsApp. Fase 1: links wa.me (o atendente clica e envia).
 * Fase 2: WhatsApp Business API (Cloud API da Meta) envia sozinho as atualizações de OS.
 */
export interface WhatsappProvider {
  enviar(telefone: string, mensagem: string): Promise<ResultadoEnvio>;
}

@Injectable()
export class LinkWaMeProvider implements WhatsappProvider {
  async enviar(telefone: string, mensagem: string): Promise<ResultadoEnvio> {
    return { canal: 'LINK_WA_ME', status: 'GERADA', link: gerarLinkWhatsApp(telefone, mensagem) };
  }
}

/**
 * Esqueleto para a WhatsApp Business API (Fase 2).
 * Requer WHATSAPP_API_TOKEN e WHATSAPP_PHONE_NUMBER_ID, templates aprovados pela Meta,
 * fila com retentativa e webhook de status. Não implementado no MVP de propósito:
 * nenhuma integração é presumida sem credenciais e documentação validadas.
 */
@Injectable()
export class BusinessApiProvider implements WhatsappProvider {
  private readonly logger = new Logger('WhatsappBusinessApi');

  constructor(
    private readonly token?: string,
    private readonly phoneNumberId?: string,
  ) {}

  async enviar(): Promise<ResultadoEnvio> {
    if (!this.token || !this.phoneNumberId) {
      throw new ServiceUnavailableException('WhatsApp Business API não configurada (WHATSAPP_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID).');
    }
    this.logger.warn('Envio via Business API ainda não implementado (Fase 2).');
    throw new NotImplementedException('Envio automático via WhatsApp Business API previsto para a Fase 2.');
  }
}
