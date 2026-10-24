import type { Perfil } from './tipos-perfil';

export type { Perfil };

interface ItemMenu {
  href: string;
  rotulo: string;
  /** Perfis com acesso, além do ADMIN (que acessa tudo). Espelha os @Perfis da API. */
  perfis: Perfil[];
}

/** Ordem = ordem do menu lateral. */
export const MENU: ItemMenu[] = [
  { href: '/app', rotulo: 'Dashboard', perfis: ['GESTOR'] },
  { href: '/app/os', rotulo: 'Ordens de serviço', perfis: ['GESTOR', 'COMERCIAL', 'MARCENEIRO'] },
  { href: '/app/projetos', rotulo: 'Projetos e cálculo', perfis: ['GESTOR', 'COMERCIAL', 'MARCENEIRO'] },
  { href: '/app/chapas', rotulo: 'Chapas', perfis: ['GESTOR', 'COMERCIAL', 'MARCENEIRO'] },
  { href: '/app/leads', rotulo: 'Leads B2B', perfis: ['GESTOR', 'COMERCIAL'] },
  { href: '/app/medicao', rotulo: 'Medição (obra)', perfis: ['GESTOR', 'COMERCIAL', 'MARCENEIRO'] },
];

function itemDaRota(rota: string): ItemMenu | undefined {
  const limpa = rota.replace(/\/+$/, '') || '/';
  if (limpa === '/app') return MENU[0];
  // o item mais específico cuja rota é prefixo (ex.: /app/os/123 -> /app/os)
  return MENU.filter((m) => m.href !== '/app' && (limpa === m.href || limpa.startsWith(`${m.href}/`))).sort((a, b) => b.href.length - a.href.length)[0];
}

export function podeAcessar(perfil: Perfil, rota: string): boolean {
  const item = itemDaRota(rota);
  if (!item) return false;
  return perfil === 'ADMIN' || item.perfis.includes(perfil);
}

export function menuPara(perfil: Perfil): { href: string; rotulo: string }[] {
  return MENU.filter((m) => perfil === 'ADMIN' || m.perfis.includes(perfil)).map(({ href, rotulo }) => ({ href, rotulo }));
}

/** Primeira tela após o login. */
export function rotaInicial(perfil: Perfil): string {
  return podeAcessar(perfil, '/app') ? '/app' : '/app/os';
}

/** Ações finas dentro das telas (também espelham a API). */
export const PODE = {
  editarChapas: (p: Perfil) => p === 'ADMIN' || p === 'GESTOR',
  criarOs: (p: Perfil) => ['ADMIN', 'GESTOR', 'COMERCIAL'].includes(p),
  financeiro: (p: Perfil) => ['ADMIN', 'GESTOR', 'COMERCIAL'].includes(p),
  cancelarPagamento: (p: Perfil) => p === 'ADMIN' || p === 'GESTOR',
};
