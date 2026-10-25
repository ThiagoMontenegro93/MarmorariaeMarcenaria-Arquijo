import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { ArmazenamentoLocal, chaveValida, extensaoPorMime, validarFoto } from '../src/armazenamento/armazenamento';

const dir = mkdtempSync(join(tmpdir(), 'arquijo-arq-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('validarFoto', () => {
  it('aceita jpeg/png/webp até 5 MB', () => {
    expect(validarFoto('image/jpeg', 1000)).toBeNull();
    expect(validarFoto('image/webp', 5 * 1024 * 1024)).toBeNull();
  });

  it('rejeita outros tipos e arquivos grandes', () => {
    expect(validarFoto('application/pdf', 10)).toMatch(/tipo/i);
    expect(validarFoto('image/png', 5 * 1024 * 1024 + 1)).toMatch(/5 MB/);
  });
});

describe('extensaoPorMime e chaveValida', () => {
  it('mapeia extensão e valida chaves geradas pelo sistema', () => {
    expect(extensaoPorMime('image/jpeg')).toBe('jpg');
    expect(chaveValida('medicoes/0f8fad5b-d9cb-469f-a165-70867728950e.jpg')).toBe(true);
    expect(chaveValida('../etc/passwd')).toBe(false);
    expect(chaveValida('medicoes/abc.exe')).toBe(false);
  });
});

describe('ArmazenamentoLocal', () => {
  const arm = new ArmazenamentoLocal(dir);

  it('salva e lê de volta o mesmo conteúdo', async () => {
    const { chave } = await arm.salvar('medicoes', Buffer.from('foto'), 'image/png');
    expect(chaveValida(chave)).toBe(true);
    const lido = await arm.ler(chave);
    expect(lido.conteudo.toString()).toBe('foto');
    expect(lido.tipo).toBe('image/png');
  });

  it('recusa chave inválida (path traversal)', async () => {
    await expect(arm.ler('../../segredo.jpg')).rejects.toThrow(/inválid/);
  });
});

describe('tipoPorAssinatura (não confia só no mimetype do cliente)', () => {
  it('reconhece PNG, JPEG e WebP pelos bytes iniciais', async () => {
    const { tipoPorAssinatura } = await import('../src/armazenamento/armazenamento');
    expect(tipoPorAssinatura(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
    expect(tipoPorAssinatura(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(tipoPorAssinatura(Buffer.from('RIFF0000WEBPVP8 '))).toBe('image/webp');
    expect(tipoPorAssinatura(Buffer.from('%PDF-1.3'))).toBeNull();
  });
});
