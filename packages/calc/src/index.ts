/**
 * @arquijo/calc — motor puro de cálculo de chapas e prévia de custo.
 * Sem dependências de runtime; pode rodar na API, no navegador ou num worker.
 */
export * from './tipos';
export * from './erros';
export { arredondar2 } from './numeros';
export { calcularPlanoCorte, ESPESSURA_SERRA_PADRAO_MM, SOBRA_MINIMA_PADRAO_MM } from './guilhotina';
export * from './custo';
