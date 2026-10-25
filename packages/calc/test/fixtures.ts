import type { Chapa, Peca } from '../src';

/** Chapas padrão do prompt mestre: MDF 2750x1850 18mm R$ 280 e MDF 2750x2100 15mm R$ 310. */
export const chapaFreijo18: Chapa = {
  id: 'freijo-18',
  nome: 'MDF Freijó 18mm',
  larguraMm: 2750,
  alturaMm: 1850,
  espessuraMm: 18,
  qtdEstoque: 0,
  custoUnitario: 280,
};

export const chapaBranco15: Chapa = {
  id: 'branco-15',
  nome: 'MDF Branco 15mm',
  larguraMm: 2750,
  alturaMm: 2100,
  espessuraMm: 15,
  qtdEstoque: 5,
  custoUnitario: 310,
};

/** Cut list do exemplo do PDF. */
export const pecasExemploPdf: Peca[] = [
  { nome: 'Porta', larguraMm: 700, alturaMm: 400, quantidade: 2, chapaId: 'freijo-18', veio: true },
  { nome: 'Lateral', larguraMm: 2100, alturaMm: 600, quantidade: 2, chapaId: 'freijo-18', veio: true },
  { nome: 'Prateleira', larguraMm: 560, alturaMm: 400, quantidade: 4, chapaId: 'branco-15', veio: false },
  { nome: 'Fundo', larguraMm: 2100, alturaMm: 580, quantidade: 1, chapaId: 'branco-15', veio: false },
];
