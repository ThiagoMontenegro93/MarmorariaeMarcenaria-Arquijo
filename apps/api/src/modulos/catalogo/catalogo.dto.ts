import { TipoCliente } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class QuizDto {
  @IsIn(['MODERNO', 'CLASSICO', 'MINIMALISTA']) estilo: 'MODERNO' | 'CLASSICO' | 'MINIMALISTA';
  @IsIn(['ATE_40', 'DE_40_A_80', 'ACIMA_80']) tamanho: 'ATE_40' | 'DE_40_A_80' | 'ACIMA_80';
  @IsIn(['ATE_5K', 'DE_5K_A_15K', 'ACIMA_15K']) orcamento: 'ATE_5K' | 'DE_5K_A_15K' | 'ACIMA_15K';
}

export class FiltroModelosDto {
  @IsOptional() @IsString() @MaxLength(60) ambiente?: string;
  @IsOptional() @IsString() @MaxLength(60) colecao?: string;
}

export class FiltroObrasDto {
  /** Filtra por material contido (ex.: "MDF", "Mármore"). */
  @IsOptional() @IsString() @MaxLength(40) material?: string;
  @IsOptional() @IsEnum(TipoCliente) tipoCliente?: TipoCliente;
}
