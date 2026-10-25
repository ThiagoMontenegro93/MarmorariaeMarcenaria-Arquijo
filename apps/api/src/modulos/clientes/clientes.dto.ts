import { PartialType } from '@nestjs/swagger';
import { TipoCliente } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';

const aparar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CriarClienteDto {
  @Transform(aparar)
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nome: string;

  /** WhatsApp com DDD, com ou sem máscara. */
  @Matches(/^[\d\s()+-]{10,20}$/, { message: 'Telefone inválido.' })
  telefone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^[\d./-]{11,18}$/, { message: 'CPF/CNPJ inválido.' })
  documento?: string;

  @IsOptional() @IsString() @MaxLength(255) endereco?: string;
  @IsOptional() @IsString() @MaxLength(80) bairro?: string;
  @IsOptional() @IsString() @MaxLength(80) cidade?: string;
  @IsOptional() @IsEnum(TipoCliente) tipo?: TipoCliente;

  /** LGPD: consentimento explícito do titular para tratamento e contato. */
  @IsBoolean()
  consentimentoLgpd: boolean;

  @IsOptional() @IsString() @MaxLength(60) consentimentoOrigem?: string;
  @IsOptional() @IsString() @MaxLength(2000) observacoes?: string;
}

export class AtualizarClienteDto extends PartialType(CriarClienteDto) {}

export class FiltroClientesDto extends PaginacaoDto {
  @IsOptional() @IsString() @MaxLength(100) busca?: string;
}
