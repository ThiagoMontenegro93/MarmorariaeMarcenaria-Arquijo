import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

export class ParedeDto {
  @IsString() @MinLength(1) @MaxLength(40) nome: string;
  @IsInt() @Min(1) @Max(20000) larguraMm: number;
  @IsInt() @Min(1) @Max(10000) alturaMm: number;
}

/** Campo "dados" (JSON) do multipart enviado pelo PWA. */
export class MedicaoDto {
  /** UUID gerado no aparelho — reenvios com o mesmo id não duplicam. */
  @IsUUID() idLocal: string;
  @IsString() @MinLength(2) @MaxLength(80) ambiente: string;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ParedeDto)
  paredes: ParedeDto[];

  @IsOptional() @IsString() @MaxLength(4000) observacoes?: string;
  @IsDateString() medidoEm: string;
}
