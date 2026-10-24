import { registerDecorator, type ValidationOptions } from 'class-validator';
import { cnpjValido } from '../../dominio/cnpj';

/** Valida CNPJ pelos dígitos verificadores. */
export function IsCnpj(opcoes?: ValidationOptions) {
  return (alvo: object, propriedade: string) =>
    registerDecorator({
      name: 'isCnpj',
      target: alvo.constructor,
      propertyName: propriedade,
      options: { message: 'CNPJ inválido.', ...opcoes },
      validator: { validate: (v: unknown) => typeof v === 'string' && cnpjValido(v) },
    });
}
