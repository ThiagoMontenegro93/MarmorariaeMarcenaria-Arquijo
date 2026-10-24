import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export const CONTEXTOS_WHATSAPP = ['OS', 'CLIENTE', 'LEAD_B2B', 'PROJETO', 'LIVRE'] as const;
export type ContextoWhatsapp = (typeof CONTEXTOS_WHATSAPP)[number];

export class GerarLinkDto {
  @IsIn(CONTEXTOS_WHATSAPP) contexto: ContextoWhatsapp;
  /** id da OS, cliente, lead ou projeto (obrigatório exceto em LIVRE). */
  @IsOptional() @IsUUID() id?: string;
  /** Mensagem personalizada; se omitida, usa o modelo contextual. */
  @IsOptional() @IsString() @MinLength(1) @MaxLength(2000) mensagem?: string;
  /** Obrigatório no contexto LIVRE. */
  @IsOptional() @Matches(/^[\d\s()+-]{10,20}$/) telefone?: string;
}
