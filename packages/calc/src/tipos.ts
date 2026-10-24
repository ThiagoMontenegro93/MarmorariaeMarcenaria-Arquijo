/**
 * Tipos públicos do motor de cálculo de chapas.
 * Todas as medidas em milímetros (mm) e valores monetários em reais (R$).
 */

/** Chapa (MDF, compensado etc.) cadastrada com tamanho fixo e estoque — RF01. */
export interface Chapa {
  id: string;
  nome: string;
  larguraMm: number;
  alturaMm: number;
  espessuraMm: number;
  /** Quantidade disponível em estoque. */
  qtdEstoque: number;
  /** Custo por chapa em R$. */
  custoUnitario: number;
  fornecedor?: string;
}

/** Peça da cut list do projeto — RF02. */
export interface Peca {
  /** Identificador opcional (ex.: id do banco) devolvido no plano de corte. */
  id?: string;
  nome: string;
  /** Medida no sentido da largura da chapa (sentido do veio). */
  larguraMm: number;
  alturaMm: number;
  quantidade: number;
  /** Chapa (material) da qual a peça deve ser cortada. */
  chapaId: string;
  /** true = peça tem veio e NÃO pode ser rotacionada. */
  veio: boolean;
}

export interface OpcoesCalculo {
  /** Espessura do disco de serra consumida a cada corte. Padrão: 4mm. */
  espessuraSerraMm?: number;
  /** Lado mínimo para uma sobra ser considerada retalho reaproveitável. Padrão: 300mm. */
  sobraMinimaMm?: number;
}

export interface Retangulo {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

export interface PecaPosicionada extends Retangulo {
  id?: string;
  nome: string;
  /** true quando a peça foi girada 90° para caber (nunca ocorre com veio). */
  rotacionada: boolean;
  veio: boolean;
}

/** Plano de corte de uma única chapa — base do desenho 2D (RF04). */
export interface PlanoChapa {
  indice: number;
  pecas: PecaPosicionada[];
  /** Sobras reaproveitáveis (retalhos) desta chapa. */
  sobras: Retangulo[];
  aproveitamentoPct: number;
}

export interface ResultadoMaterial {
  chapa: Chapa;
  chapasUsadas: number;
  planos: PlanoChapa[];
  areaPecasMm2: number;
  areaChapasMm2: number;
  aproveitamentoPct: number;
  desperdicioPct: number;
  /** Quantas chapas saem do estoque. */
  qtdDoEstoque: number;
  /** Quantas chapas precisam ser compradas. */
  qtdCompra: number;
  custoCompra: number;
  /** Custo de todas as chapas usadas (estoque + compra). */
  custoTotal: number;
}

export interface ItemCompra {
  chapaId: string;
  nome: string;
  quantidade: number;
  custoUnitario: number;
  custoTotal: number;
}

export interface ResultadoCalculo {
  materiais: ResultadoMaterial[];
  totalChapas: number;
  aproveitamentoGeralPct: number;
  desperdicioGeralPct: number;
  custoTotalChapas: number;
  /** Lista de compra (RF06): somente o que falta no estoque. */
  listaCompra: ItemCompra[];
  espessuraSerraMm: number;
}
