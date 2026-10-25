/** Cliente HTTP mínimo da API. A URL vem de NEXT_PUBLIC_API_URL (padrão: localhost:3001). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** GET com revalidação (ISR) e fallback: o site continua no ar se a API cair. */
export async function buscarComFallback<T>(caminho: string, fallback: T, revalidar = 300): Promise<T> {
  // No servidor (ex.: dentro do Docker) a API pode ter outro endereço: API_URL_INTERNA.
  const base = typeof window === 'undefined' ? (process.env.API_URL_INTERNA ?? API_URL) : API_URL;
  try {
    const r = await fetch(`${base}${caminho}`, { next: { revalidate: revalidar }, signal: AbortSignal.timeout(3000) });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

export interface Colecao {
  slug: string;
  nome: string;
  descricao: string;
  materiais: string[];
  precoAPartirDe: string | number;
  publicoAlvo?: string | null;
  destaque?: boolean;
}

export interface Modelo {
  slug: string;
  nome: string;
  ambiente: string;
  areaM2?: string | number | null;
  materiais: string;
  preco?: string | number | null;
  sobConsulta?: boolean;
  colecao?: { slug: string; nome: string } | null;
}

export function formatarReais(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return 'Sob consulta';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
