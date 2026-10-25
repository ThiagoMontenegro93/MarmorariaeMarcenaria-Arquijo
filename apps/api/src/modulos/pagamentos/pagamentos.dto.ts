import { FormaPagamento, TipoPagamento } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CriarPagamentoDto {
  @IsUUID() ordemServicoId: string;
  @IsEnum(TipoPagamento) tipo: TipoPagamento;
  @IsEnum(FormaPagamento) forma: FormaPagamento;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) valor: number;
  @IsOptional() @IsInt() @Min(1) @Max(24) parcelas?: number;
  @IsOptional() @IsDateString() vencimento?: string;
  /** true = já recebido agora (registra pagoEm). */
  @IsOptional() @IsBoolean() pago?: boolean;
  @IsOptional() @IsString() @MaxLength(500) observacao?: string;
}

export class PlanoPadraoDto {
  @IsEnum(FormaPagamento) forma: FormaPagamento;
  /** Vencimento do saldo; padrão = prazo acordado da OS. */
  @IsOptional() @IsDateString() vencimentoSaldo?: string;
}

export class ConfirmarPagamentoDto {
  @IsOptional() @IsDateString() pagoEm?: string;
  @IsOptional() @IsEnum(FormaPagamento) forma?: FormaPagamento;
}
