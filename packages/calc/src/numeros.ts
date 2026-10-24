/** Arredonda para 2 casas decimais (centavos / percentuais). */
export function arredondar2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
