'use client';

/** Chamada à API a partir do navegador, via proxy autenticado do Next (cookie httpOnly). */
export class ErroApi extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function api<T>(caminho: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...resto } = init;
  const r = await fetch(`/api/proxy${caminho}`, {
    ...resto,
    headers: json !== undefined ? { 'Content-Type': 'application/json', ...(resto.headers ?? {}) } : resto.headers,
    body: json !== undefined ? JSON.stringify(json) : resto.body,
  });
  if (r.status === 401) {
    window.location.href = `/login?expirou=1&proximo=${encodeURIComponent(window.location.pathname)}`;
    throw new ErroApi('Sessão expirada.', 401);
  }
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = Array.isArray(dados.message) ? dados.message.join(' ') : (dados.message ?? `Erro ${r.status}`);
    throw new ErroApi(msg, r.status);
  }
  return dados as T;
}

/** URL para baixar arquivos (PDF) pela mesma origem. */
export function urlDownload(caminho: string): string {
  return `/api/proxy${caminho}`;
}
