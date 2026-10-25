import { PartialType, PickType } from '@nestjs/swagger';
import { PrioridadeOS, StatusOS } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CriarOrdemServicoDto {
  @IsUUID() clienteId: string;
  /** Se informado, o cálculo de chapas do projeto roda automaticamente na criação da OS. */
  @IsOptional() @IsUUID() projetoId?: string;
  @IsOptional() @IsUUID() responsavelId?: string;
  @IsString() @MinLength(2) @MaxLength(80) ambiente: string;
  @IsOptional() @IsString() @MaxLength(2000) descricao?: string;
  @IsOptional() @IsEnum(PrioridadeOS) prioridade?: PrioridadeOS;
  /** Data de entrega combinada (ISO 8601). */
  @IsOptional() @IsDateString() prazoAcordado?: string;
  /** Se omitido e houver projeto, usa o valor final da prévia de custo. */
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) valorTotal?: number;
}

export class AtualizarOrdemServicoDto extends PartialType(
  PickType(CriarOrdemServicoDto, ['responsavelId', 'ambiente', 'descricao', 'prioridade', 'prazoAcordado', 'valorTotal'] as const),
) {
  @IsOptional() @IsDateString() dataMedicao?: string;
}

export class AvancarEtapaDto {
  @IsOptional() @IsString() @MaxLength(500) observacao?: string;
}

export class FiltroOrdensDto {
  @IsOptional() @IsEnum(StatusOS) status?: StatusOS;
  @IsOptional() @IsEnum(PrioridadeOS) prioridade?: PrioridadeOS;
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  atrasadas?: boolean;
  @IsOptional() @IsUUID() responsavelId?: string;
}
