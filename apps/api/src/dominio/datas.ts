/** Utilitários de data no fuso de operação da marcenaria (Rio de Janeiro). */
export const FUSO_OPERACAO = 'America/Sao_Paulo';

const formatadorDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_OPERACAO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "AAAA-MM-DD" do dia civil no fuso de operação. */
export function diaCivil(data: Date): string {
  return formatadorDia.format(data);
}

/** Diferença em dias civis (b - a) no fuso de operação. */
export function diferencaDias(a: Date, b: Date): number {
  const ms = Date.parse(`${diaCivil(b)}T00:00:00Z`) - Date.parse(`${diaCivil(a)}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Último dia do mês (dia civil "AAAA-MM-DD") da data informada. */
export function ultimoDiaDoMes(data: Date): string {
  const [ano, mes] = diaCivil(data).split('-').map(Number) as [number, number];
  const ultimo = new Date(Date.UTC(ano, mes, 0));
  return ultimo.toISOString().slice(0, 10);
}
