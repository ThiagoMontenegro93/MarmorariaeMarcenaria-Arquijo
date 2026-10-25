import type { Prisma } from '@prisma/client';

/** Converte Decimal do Prisma (ou null) para number em reais. */
export function num(valor: Prisma.Decimal | number | null | undefined): number {
  if (valor === null || valor === undefined) return 0;
  return typeof valor === 'number' ? valor : Number(valor.toString());
}
