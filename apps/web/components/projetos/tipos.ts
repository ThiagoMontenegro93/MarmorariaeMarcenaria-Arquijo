export interface Chapa {
  id: string;
  nome: string;
  material: string;
  larguraMm: number;
  alturaMm: number;
  espessuraMm: number;
  qtdEstoque: number;
  custoUnitario: string;
  fornecedor: string | null;
}

export interface LinhaPeca {
  nome: string;
  larguraMm: number;
  alturaMm: number;
  quantidade: number;
  chapaId: string;
  veio: boolean;
}

export interface Ferragem {
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface ResultadoCalculo {
  totalChapas: number;
  aproveitamentoGeralPct: number;
  desperdicioGeralPct: number;
  custoTotalChapas: number;
  listaCompra: { chapaId: string; nome: string; quantidade: number; custoUnitario: number; custoTotal: number }[];
  materiais: {
    chapa: { id: string; nome: string; larguraMm: number; alturaMm: number };
    chapasUsadas: number;
    qtdDoEstoque: number;
    qtdCompra: number;
    aproveitamentoPct: number;
    desperdicioPct: number;
    planos: {
      indice: number;
      aproveitamentoPct: number;
      pecas: { nome: string; x: number; y: number; largura: number; altura: number; rotacionada: boolean }[];
      sobras: { x: number; y: number; largura: number; altura: number }[];
    }[];
  }[];
}

export interface PreviaCusto {
  custoMdf: number;
  custoFita: number;
  custoFerragens: number;
  custoMaoDeObra: number;
  custoTotal: number;
  margemPct: number;
  margemValor: number;
  valorFinal: number;
  metrosFitaBorda?: number;
}

export interface Projeto {
  id: string;
  nome: string;
  ambiente: string | null;
  espessuraSerraMm: number;
  precoFitaPorMetro: string;
  horasMaoDeObra: string;
  valorHora: string;
  margemPct: string;
  ferragens: Ferragem[];
  resultadoCalculo: ResultadoCalculo | null;
  previaCusto: PreviaCusto | null;
  calculadoEm: string | null;
  cliente: { id: string; nome: string } | null;
  pecas: (LinhaPeca & { id: string })[];
}
