import { StatusLeadB2B, TipoEmpresaB2B } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IsCnpj } from './cnpj.validator';

const aparar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Formulário público da landing /empresas (Módulo F). */
export class CriarLeadB2BDto {
  @IsEnum(TipoEmpresaB2B) tipo: TipoEmpresaB2B;
  @Transform(aparar) @IsString() @MinLength(2) @MaxLength(150) nomeEmpresa: string;
  @IsCnpj() cnpj: string;
  @Transform(aparar) @IsString() @MinLength(2) @MaxLength(120) responsavel: string;
  @Matches(/^[\d\s()+-]{10,20}$/, { message: 'WhatsApp inválido.' }) whatsapp: string;
  @IsOptional() @IsEmail() email?: string;
  @IsInt() @Min(1) @Max(10000) unidades: number;
  @IsOptional() @Transform(aparar) @IsString() @MaxLength(60) prazoDesejado?: string;
  @IsOptional() @Transform(aparar) @IsString() @MaxLength(80) bairro?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) orcamentoEstimado?: number;
  @IsBoolean() precisaMedicao: boolean;
  @IsOptional() @Transform(aparar) @IsString() @MaxLength(2000) mensagem?: string;
  /** LGPD: o envio exige aceite explícito. */
  @Equals(true, { message: 'É necessário aceitar o uso dos dados para contato (LGPD).' })
  consentimentoLgpd: boolean;
  /** Honeypot anti-robô: campo invisível no formulário, deve vir vazio. */
  @IsOptional() @IsString() @MaxLength(0, { message: 'Requisição inválida.' }) site?: string;
}

export class AtualizarStatusLeadDto {
  @IsEnum(StatusLeadB2B) status: StatusLeadB2B;
  @IsOptional() @IsUUID() responsavelId?: string;
}

export class SimularVolumeDto {
  @IsInt() @Min(1) @Max(10000) unidades: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) valorUnitario: number;
}

export class FiltroLeadsDto {
  @IsOptional() @IsEnum(StatusLeadB2B) status?: StatusLeadB2B;
  @IsOptional() @IsEnum(TipoEmpresaB2B) tipo?: TipoEmpresaB2B;
}
