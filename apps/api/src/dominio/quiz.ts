/** Quiz de sugestão (RF09): estilo + tamanho + orçamento filtram as coleções. */
export type Estilo = 'MODERNO' | 'CLASSICO' | 'MINIMALISTA';
export type Tamanho = 'ATE_40' | 'DE_40_A_80' | 'ACIMA_80';
export type FaixaOrcamento = 'ATE_5K' | 'DE_5K_A_15K' | 'ACIMA_15K';

export interface RespostaQuiz {
  estilo: Estilo;
  tamanho: Tamanho;
  orcamento: FaixaOrcamento;
}

const TETO_ORCAMENTO: Record<FaixaOrcamento, number> = {
  ATE_5K: 5000,
  DE_5K_A_15K: 15000,
  ACIMA_15K: Number.POSITIVE_INFINITY,
};

interface ColecaoQuiz {
  slug: string;
  precoAPartirDe: number;
  estilos: string[];
}

export function sugerirColecoes<T extends ColecaoQuiz>(colecoes: T[], r: RespostaQuiz): T[] {
  const teto = TETO_ORCAMENTO[r.orcamento];
  const cabem = colecoes.filter((c) => c.precoAPartirDe <= teto);
  if (cabem.length === 0) {
    // Nunca devolve vazio: oferece a mais acessível.
    return [...colecoes].sort((a, b) => a.precoAPartirDe - b.precoAPartirDe).slice(0, 1);
  }
  // Imóveis maiores e orçamento alto tendem às coleções mais completas.
  const preferirMaisCompleta = r.orcamento === 'ACIMA_15K' || r.tamanho === 'ACIMA_80';
  return [...cabem].sort((a, b) => {
    const estiloA = a.estilos.includes(r.estilo) ? 0 : 1;
    const estiloB = b.estilos.includes(r.estilo) ? 0 : 1;
    if (estiloA !== estiloB) return estiloA - estiloB;
    return preferirMaisCompleta ? b.precoAPartirDe - a.precoAPartirDe : a.precoAPartirDe - b.precoAPartirDe;
  });
}
