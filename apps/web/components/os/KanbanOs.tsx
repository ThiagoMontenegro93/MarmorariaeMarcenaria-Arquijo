'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/cliente-api';
import { COR_ETAPA, type Etapa } from '@/lib/formato';
import { CardOs } from './CardOs';
import { NovaOs } from './NovaOs';
import type { OsResumo } from './tipos';

interface Coluna {
  etapa: Etapa;
  rotulo: string;
  ordens: OsResumo[];
}

export function KanbanOs({ podeCriar }: { podeCriar: boolean }) {
  const [colunas, setColunas] = useState<Coluna[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setColunas(await api<Coluna[]>('/ordens-servico/kanban'));
    } catch (e) {
      setErro((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function avancar(id: string) {
    setOcupado(id);
    setErro(null);
    try {
      await api(`/ordens-servico/${id}/avancar`, { method: 'PATCH', json: {} });
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo-pagina">Ordens de serviço</h1>
        {podeCriar && <NovaOs aoCriar={carregar} />}
      </div>
      {erro && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-800">
          {erro}
        </p>
      )}
      {!colunas ? (
        <p className="text-sm text-stone-500">Carregando…</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4" role="list" aria-label="Kanban de OS">
          {colunas.map((c) => (
            <section key={c.etapa} role="listitem" aria-label={c.rotulo} data-etapa={c.etapa} className="w-64 flex-none rounded-xl bg-white/60 p-2">
              <header className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold">
                <span className={`h-2.5 w-2.5 rounded-full ${COR_ETAPA[c.etapa]}`} aria-hidden />
                {c.rotulo}
                <span className="ml-auto text-xs text-stone-500">{c.ordens.length}</span>
              </header>
              <div className="space-y-2">
                {c.ordens.map((o) => (
                  <CardOs key={o.id} os={o} ocupado={ocupado === o.id} onAvancar={() => avancar(o.id)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
