import { describe, expect, it } from 'vitest';
import { cnpjValido, somenteDigitos } from '../src/dominio/cnpj';

describe('cnpjValido', () => {
  it('aceita CNPJ com dígitos verificadores corretos (com ou sem máscara)', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true);
    expect(cnpjValido('11222333000181')).toBe(true);
  });

  it('rejeita dígito verificador errado, tamanho errado e sequência repetida', () => {
    expect(cnpjValido('11.222.333/0001-82')).toBe(false);
    expect(cnpjValido('1122233300018')).toBe(false);
    expect(cnpjValido('00000000000000')).toBe(false);
  });

  it('somenteDigitos remove a máscara', () => {
    expect(somenteDigitos('11.222.333/0001-81')).toBe('11222333000181');
  });
});
