import { SetMetadata } from '@nestjs/common';

export const CHAVE_PUBLICO = 'rotaPublica';
/** Marca a rota como pública (sem JWT). Todo o resto exige autenticação por padrão. */
export const Publico = () => SetMetadata(CHAVE_PUBLICO, true);
