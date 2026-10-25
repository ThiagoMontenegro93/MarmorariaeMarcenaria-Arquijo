export const PERFIS = ['ADMIN', 'GESTOR', 'MARCENEIRO', 'COMERCIAL'] as const;
export type Perfil = (typeof PERFIS)[number];
