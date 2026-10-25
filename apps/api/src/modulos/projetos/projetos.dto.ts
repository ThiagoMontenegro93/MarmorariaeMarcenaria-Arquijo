import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PecaDto {
  /** Porta, Lateral Esquerda, Prateleira, Fundo, Base... */
  @IsString() @MinLength(1) @MaxLength(80) nome: string;
  @IsInt() @Min(1) @Max(5000) larguraMm: number;
  @IsInt() @Min(1) @Max(5000) alturaMm: number;
  @IsInt() @Min(1) @Max(1000) quantidade: number;
  /** Chapa/material de onde a peça sai. */
  @IsUUID() chapaId: string;
  /** true = tem veio, não pode girar. */
  @IsBoolean() veio: boolean;
}

export class FerragemDto {
  @IsString() @MaxLength(80) nome: string;
  @IsInt() @Min(0) quantidade: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) precoUnitario: number;
}

export class CriarProjetoDto {
  @IsString() @MinLength(2) @MaxLength(150) nome: string;
  @IsOptional() @IsString() @MaxLength(80) ambiente?: string;
  @IsOptional() @IsUUID() clienteId?: string;
  @IsOptional() @IsUUID() modeloId?: string;
  @IsOptional() @IsInt() @Min(0) @Max(10) espessuraSerraMm?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) precoFitaPorMetro?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) horasMaoDeObra?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) valorHora?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(500) margemPct?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => FerragemDto)
  ferragens?: FerragemDto[];

  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => PecaDto)
  pecas: PecaDto[];
}

export class AtualizarProjetoDto extends PartialType(OmitType(CriarProjetoDto, ['pecas'] as const)) {}

export class SubstituirPecasDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => PecaDto)
  pecas: PecaDto[];
}
