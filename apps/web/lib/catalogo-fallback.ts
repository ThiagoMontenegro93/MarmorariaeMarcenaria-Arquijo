import type { Colecao, Modelo } from './api';

/** Conteúdo estático usado quando a API está fora (mesmos dados do seed). */
export const COLECOES_FALLBACK: Colecao[] = [
  { slug: 'essencial', nome: 'Essencial', descricao: 'MDF Branco TX + Carvalho. Ideal para locação, primeiro apê e imobiliárias.', materiais: ['MDF Branco TX', 'MDF Carvalho'], precoAPartirDe: 3200 },
  { slug: 'moderna', nome: 'Moderna', descricao: 'MDF Freijó, Grafite e Nogueira com painel ripado e LED. A mais vendida.', materiais: ['MDF Freijó', 'MDF Grafite', 'MDF Nogueira', 'Painel ripado', 'LED'], precoAPartirDe: 6500, destaque: true },
  { slug: 'premium', nome: 'Premium', descricao: 'MDF + madeira maciça + mármore Calacatta/Carrara/Travertino, granito e quartzo.', materiais: ['Cumaru', 'Jequitibá', 'Mármore', 'Granito Preto São Gabriel', 'Quartzo Branco'], precoAPartirDe: 14000 },
];

export const MODELOS_FALLBACK: Modelo[] = [
  { slug: 'cozinha-ilha-central', nome: 'Cozinha com Ilha Central', ambiente: 'Cozinha', areaM2: 12, materiais: 'MDF Freijó + Quartzo', preco: 18500 },
  { slug: 'cozinha-americana-bancada', nome: 'Cozinha Americana com Bancada', ambiente: 'Cozinha', areaM2: 8, materiais: 'MDF Branco + Granito', preco: 12400 },
  { slug: 'closet-casal-completo', nome: 'Closet Casal Completo', ambiente: 'Closet', areaM2: 6, materiais: 'MDF Grafite + Freijó', preco: 9800 },
  { slug: 'closet-solteiro', nome: 'Closet Solteiro', ambiente: 'Closet', areaM2: 3, materiais: 'MDF Branco + Carvalho', preco: 4200 },
  { slug: 'painel-ripado-tv-75', nome: 'Painel Ripado TV até 75"', ambiente: 'Sala', materiais: 'MDF Freijó ripado 2,5cm + nicho off white', preco: 2850 },
  { slug: 'home-office-planejado', nome: 'Home Office Planejado', ambiente: 'Escritório', areaM2: 4, materiais: 'MDF Nogueira', preco: 5600 },
  { slug: 'banheiro-planejado', nome: 'Banheiro Planejado', ambiente: 'Banheiro', materiais: 'MDF naval + bancada porcelanato', preco: 3800 },
  { slug: 'corporativo-recepcao-estacoes', nome: 'Corporativo — recepção e estações', ambiente: 'Corporativo', materiais: 'Sob projeto', preco: null, sobConsulta: true },
];
