import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginacaoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  porPagina: number = 20;
}

export function paginar(p: PaginacaoDto): { skip: number; take: number } {
  return { skip: (p.pagina - 1) * p.porPagina, take: p.porPagina };
}
