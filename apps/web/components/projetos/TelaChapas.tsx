'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/cliente-api';
import { brl } from '@/lib/formato';
import type { Chapa } from './tipos';

export function TelaChapas({ podeEditar, podeAjustarEstoque }: { podeEditar: boolean; podeAjustarEstoque: boolean }) {
  const [chapas, setChapas] = useState<Chapa[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => api<Chapa[]>('/chapas').then(setChapas).catch((e: Error) => setErro(e.message)), []);
  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const n = (k: string) => Number(f.get(k));
    try {
      await api('/chapas', {
        method: 'POST',
        json: {
          nome: f.get('nome'),
          material: f.get('material'),
          larguraMm: n('larguraMm'),
          alturaMm: n('alturaMm'),
          espessuraMm: n('espessuraMm'),
          qtdEstoque: n('qtdEstoque'),
          custoUnitario: n('custoUnitario'),
          fornecedor: f.get('fornecedor') || undefined,
        },
      });
      form.reset();
      await carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function ajustar(id: string, delta: number) {
    try {
      await api(`/chapas/${id}/estoque`, { method: 'POST', json: { delta, motivo: delta > 0 ? 'entrada manual' : 'baixa manual' } });
      await carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="titulo-pagina">Chapas e estoque</h1>
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <div className="cartao overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-stone-500">
            <tr>
              <th className="py-1">Chapa</th>
              <th>Medidas (mm)</th>
              <th>Esp.</th>
              <th>Custo</th>
              <th>Estoque</th>
              <th>Fornecedor</th>
            </tr>
          </thead>
          <tbody>
            {chapas.map((c) => (
              <tr key={c.id} className="border-t border-linha">
                <td className="py-1.5 font-medium">{c.nome}</td>
                <td className="tabular-nums">
                  {c.larguraMm}×{c.alturaMm}
                </td>
                <td>{c.espessuraMm}mm</td>
                <td className="tabular-nums">{brl(c.custoUnitario)}</td>
                <td className="tabular-nums">
                  {podeAjustarEstoque && (
                    <button type="button" aria-label={`Baixar estoque de ${c.nome}`} className="mr-2 rounded border border-linha px-1.5" onClick={() => ajustar(c.id, -1)} disabled={c.qtdEstoque === 0}>
                      −
                    </button>
                  )}
                  {c.qtdEstoque}
                  {podeAjustarEstoque && (
                    <button type="button" aria-label={`Entrada de estoque de ${c.nome}`} className="ml-2 rounded border border-linha px-1.5" onClick={() => ajustar(c.id, 1)}>
                      +
                    </button>
                  )}
                </td>
                <td>{c.fornecedor ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {podeEditar && (
        <form onSubmit={criar} className="cartao grid gap-3 sm:grid-cols-4" aria-label="Cadastrar chapa">
          <input name="nome" required placeholder="Nome (ex.: MDF Freijó 18mm)" className="campo sm:col-span-2" />
          <input name="material" required placeholder="Material (ex.: MDF Freijó)" className="campo" />
          <input name="fornecedor" placeholder="Fornecedor" className="campo" />
          <input name="larguraMm" type="number" required defaultValue={2750} aria-label="Largura mm" className="campo" />
          <input name="alturaMm" type="number" required defaultValue={1850} aria-label="Altura mm" className="campo" />
          <input name="espessuraMm" type="number" required defaultValue={18} aria-label="Espessura mm" className="campo" />
          <input name="qtdEstoque" type="number" required defaultValue={0} aria-label="Estoque" className="campo" />
          <input name="custoUnitario" type="number" step="0.01" required defaultValue={280} aria-label="Custo unitário" className="campo" />
          <button className="botao sm:col-span-3">Cadastrar chapa</button>
        </form>
      )}
    </div>
  );
}
