import { describe, expect, it } from 'vitest';
import { gerarLinkWhatsApp, mensagemContextual, normalizarTelefone } from '../src/dominio/whatsapp-link';

describe('normalizarTelefone', () => {
  it('remove máscara e adiciona DDI 55 quando faltar', () => {
    expect(normalizarTelefone('(21) 98450-3570')).toBe('5521984503570');
    expect(normalizarTelefone('+55 21 98450-3570')).toBe('5521984503570');
  });

  it('rejeita telefone inválido', () => {
    expect(() => normalizarTelefone('123')).toThrow(/telefone/i);
  });
});

describe('gerarLinkWhatsApp (RF19)', () => {
  it('gera link wa.me com encodeURIComponent', () => {
    expect(gerarLinkWhatsApp('5521984503570', 'Olá')).toBe('https://wa.me/5521984503570?text=Ol%C3%A1');
  });

  it('codifica caracteres especiais (&, #, quebra de linha)', () => {
    const link = gerarLinkWhatsApp('5521984503570', 'OS-101 & Cozinha #1\nok');
    expect(link).toBe('https://wa.me/5521984503570?text=OS-101%20%26%20Cozinha%20%231%0Aok');
  });
});

describe('mensagemContextual', () => {
  it('mensagem de OS cita número, ambiente e etapa', () => {
    const msg = mensagemContextual({ tipo: 'OS', nomeCliente: 'Ana', numeroOs: 101, ambiente: 'Cozinha', etapa: 'PRODUCAO' });
    expect(msg).toContain('Ana');
    expect(msg).toContain('OS-101');
    expect(msg).toContain('Cozinha');
    expect(msg).toContain('Produção');
    expect(msg).toContain('Arquijo');
  });

  it('mensagem de lead B2B cita a empresa', () => {
    expect(mensagemContextual({ tipo: 'LEAD_B2B', nomeCliente: 'João', empresa: 'Imob Barra' })).toContain('Imob Barra');
  });
});
