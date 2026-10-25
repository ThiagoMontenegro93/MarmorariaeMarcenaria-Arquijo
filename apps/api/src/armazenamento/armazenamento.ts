import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

/**
 * Armazenamento de arquivos (fotos de obra/medição).
 * MVP: disco local (volume Docker). Produção: trocar por S3 sem alterar os módulos
 * (STORAGE_PROVIDER=s3 + bucket privado e URL pré-assinada).
 */
export interface Armazenamento {
  salvar(pasta: string, conteudo: Buffer, tipo: string): Promise<{ chave: string }>;
  ler(chave: string): Promise<{ conteudo: Buffer; tipo: string }>;
}

export const ARMAZENAMENTO = Symbol('ARMAZENAMENTO');

export const TIPOS_FOTO: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const TIPO_POR_EXTENSAO: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
export const TAMANHO_MAX_FOTO = 5 * 1024 * 1024;
export const MAX_FOTOS_POR_MEDICAO = 6;

/** Retorna a mensagem de erro, ou null se a foto é aceitável. */
export function validarFoto(tipo: string, tamanho: number): string | null {
  if (!TIPOS_FOTO[tipo]) return `Tipo de arquivo não permitido (${tipo}). Use JPEG, PNG ou WebP.`;
  if (tamanho > TAMANHO_MAX_FOTO) return 'Foto maior que 5 MB.';
  return null;
}

/** Detecta o tipo real da imagem pelos primeiros bytes ("magic numbers"). */
export function tipoPorAssinatura(b: Buffer): string | null {
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

export function extensaoPorMime(tipo: string): string | undefined {
  return TIPOS_FOTO[tipo];
}

/** Só aceita chaves no formato gerado pelo sistema: pasta/uuid.ext */
export function chaveValida(chave: string): boolean {
  return /^[a-z-]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(chave);
}

export class ArmazenamentoLocal implements Armazenamento {
  private readonly raiz: string;

  constructor(diretorio: string) {
    this.raiz = resolve(diretorio);
  }

  async salvar(pasta: string, conteudo: Buffer, tipo: string): Promise<{ chave: string }> {
    const ext = extensaoPorMime(tipo);
    if (!ext || !/^[a-z-]+$/.test(pasta)) throw new Error('Arquivo ou pasta inválidos.');
    const chave = `${pasta}/${randomUUID()}.${ext}`;
    await mkdir(join(this.raiz, pasta), { recursive: true });
    await writeFile(this.caminho(chave), conteudo, { mode: 0o640 });
    return { chave };
  }

  async ler(chave: string): Promise<{ conteudo: Buffer; tipo: string }> {
    const conteudo = await readFile(this.caminho(chave));
    return { conteudo, tipo: TIPO_POR_EXTENSAO[chave.split('.').pop()!]! };
  }

  private caminho(chave: string): string {
    if (!chaveValida(chave)) throw new Error('Chave de arquivo inválida.');
    const completo = resolve(this.raiz, chave);
    if (!completo.startsWith(this.raiz + sep)) throw new Error('Chave de arquivo inválida.');
    return completo;
  }
}

/** Esqueleto do provedor S3 (Fase seguinte): exige credenciais e bucket configurados. */
export class ArmazenamentoS3 implements Armazenamento {
  constructor(private readonly bucket?: string) {}

  async salvar(): Promise<{ chave: string }> {
    throw new Error(`Armazenamento S3 ainda não implementado${this.bucket ? ` (bucket ${this.bucket})` : ''}. Use STORAGE_PROVIDER=local.`);
  }

  async ler(): Promise<{ conteudo: Buffer; tipo: string }> {
    throw new Error('Armazenamento S3 ainda não implementado.');
  }
}
