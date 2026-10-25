import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CriarChapaDto {
  /** Ex.: "MDF Freijó 18mm" */
  @IsString() @MinLength(2) @MaxLength(120) nome: string;
  /** Ex.: "MDF Freijó" */
  @IsString() @MinLength(2) @MaxLength(80) material: string;
  @IsInt() @Min(100) @Max(5000) larguraMm: number;
  @IsInt() @Min(100) @Max(5000) alturaMm: number;
  @IsInt() @Min(3) @Max(60) espessuraMm: number;
  @IsInt() @Min(0) qtdEstoque: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) custoUnitario: number;
  @IsOptional() @IsString() @MaxLength(120) fornecedor?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

export class AtualizarChapaDto extends PartialType(CriarChapaDto) {}

export class AjusteEstoqueDto {
  /** Positivo = entrada, negativo = baixa. */
  @IsInt() delta: number;
  @IsOptional() @IsString() @MaxLength(200) motivo?: string;
}
