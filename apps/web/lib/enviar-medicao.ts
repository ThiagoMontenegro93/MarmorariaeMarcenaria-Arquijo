'use client';

import type { MedicaoLocal, ResultadoEnvio } from './fila-medicoes';

/** Envia uma medição para POST /ordens-servico/:id/medicoes (multipart) via proxy autenticado. */
export async function enviarMedicao(m: MedicaoLocal): Promise<ResultadoEnvio> {
  const form = new FormData();
  form.append('dados', JSON.stringify({ idLocal: m.idLocal, ambiente: m.ambiente, paredes: m.paredes, observacoes: m.observacoes || undefined, medidoEm: m.medidoEm }));
  m.fotos.forEach((f, i) => form.append('fotos', f, `foto-${i + 1}.${f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg'}`));
  const r = await fetch(`/api/proxy/ordens-servico/${m.ordemServicoId}/medicoes`, { method: 'POST', body: form });
  if (r.ok) return { ok: true };
  const dados = await r.json().catch(() => ({}));
  const erro = Array.isArray(dados.message) ? dados.message.join(' ') : (dados.message ?? `Erro ${r.status}`);
  if (r.status === 401) return { ok: false, erro: 'Sessão expirada: entre novamente para sincronizar.', definitivo: false };
  return { ok: false, erro, definitivo: r.status >= 400 && r.status < 500 && r.status !== 429 };
}

/** Reduz fotos grandes do celular (máx. 1600 px, JPEG) antes de guardar/enviar. */
export async function prepararFoto(arquivo: File): Promise<Blob> {
  if (arquivo.size < 1_500_000 || typeof createImageBitmap === 'undefined') return arquivo;
  try {
    const bmp = await createImageBitmap(arquivo);
    const escala = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * escala);
    canvas.height = Math.round(bmp.height * escala);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? arquivo), 'image/jpeg', 0.82));
  } catch {
    return arquivo;
  }
}
