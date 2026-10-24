'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/cliente-api';
import { dataHora } from '@/lib/formato';

interface ProjetoLista {
  id: string;
  nome: string;
  ambiente: string | null;
  status: string;
  calculadoEm: string | null;
  cliente: { nome: string } | null;
  _count: { pecas: number };
}

export function ListaProjetos() {
  const router = useRouter();
  const [projetos, setProjetos] = useState<ProjetoLista[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api<ProjetoLista[]>('/projetos').then(setProjetos).catch((e: Error) => setErro(e.message));
  }, []);

  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const p = await api<{ id: string }>('/projetos', { method: 'POST', json: { nome: f.get('nome'), ambiente: f.get('ambiente') || undefined, pecas: [] } });
      router.push(`/app/projetos/${p.id}`);
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="titulo-pagina">Projetos e cálculo de chapas</h1>
      <form onSubmit={criar} className="cartao flex flex-wrap items-end gap-3">
        <label className="min-w-48 flex-1">
          <span className="rotulo">Novo projeto</span>
          <input name="nome" required minLength={2} placeholder="ex.: Cozinha Ana — Barra" className="campo mt-1" />
        </label>
        <label className="min-w-40">
          <span className="rotulo">Ambiente</span>
          <input name="ambiente" className="campo mt-1" />
        </label>
        <button className="botao">Criar</button>
      </form>
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {projetos?.map((p) => (
          <Link key={p.id} href={`/app/projetos/${p.id}`} className="cartao block hover:border-marca">
            <p className="font-semibold">{p.nome}</p>
            <p className="text-sm text-stone-600">
              {p.ambiente ?? '—'} · {p.cliente?.nome ?? 'sem cliente'} · {p._count.pecas} peça(s)
            </p>
            <p className="text-xs text-stone-500">{p.calculadoEm ? `calculado ${dataHora(p.calculadoEm)}` : 'ainda não calculado'}</p>
          </Link>
        ))}
        {projetos?.length === 0 && <p className="text-sm text-stone-500">Nenhum projeto ainda.</p>}
      </div>
    </div>
  );
}
