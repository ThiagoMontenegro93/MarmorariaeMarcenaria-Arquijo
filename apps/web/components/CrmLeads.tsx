'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, urlDownload } from '@/lib/cliente-api';
import { brl, data } from '@/lib/formato';

type Status = 'NOVO' | 'EM_CONTATO' | 'PROPOSTA_ENVIADA' | 'FECHADO';
const ROTULO: Record<Status, string> = { NOVO: 'Novo', EM_CONTATO: 'Em contato', PROPOSTA_ENVIADA: 'Proposta enviada', FECHADO: 'Fechado' };

interface Lead {
  id: string;
  tipo: string;
  nomeEmpresa: string;
  responsavel: string;
  unidades: number;
  bairro: string | null;
  orcamentoEstimado: string | null;
  precisaMedicao: boolean;
  status: Status;
  criadoEm: string;
}

export function CrmLeads() {
  const [colunas, setColunas] = useState<{ status: Status; leads: Lead[] }[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => api<{ status: Status; leads: Lead[] }[]>('/leads-b2b/kanban').then(setColunas).catch((e: Error) => setErro(e.message)), []);
  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function mover(id: string, status: string) {
    try {
      await api(`/leads-b2b/${id}/status`, { method: 'PATCH', json: { status } });
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function whatsapp(id: string) {
    try {
      const r = await api<{ link: string }>('/whatsapp/link', { method: 'POST', json: { contexto: 'LEAD_B2B', id } });
      window.open(r.link, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="titulo-pagina">CRM — Leads B2B</h1>
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {colunas.map((c) => (
          <section key={c.status} aria-label={ROTULO[c.status]} className="rounded-xl bg-white/60 p-2">
            <h2 className="mb-2 px-1 text-sm font-semibold">
              {ROTULO[c.status]} <span className="text-stone-500">({c.leads.length})</span>
            </h2>
            <div className="space-y-2">
              {c.leads.map((l) => (
                <article key={l.id} className="rounded-lg border border-linha bg-white p-3 text-sm">
                  <p className="font-semibold">{l.nomeEmpresa}</p>
                  <p className="text-xs text-stone-500">
                    {l.tipo} · {l.responsavel} · {data(l.criadoEm)}
                  </p>
                  <p className="mt-1">
                    {l.unidades} unidade(s){l.bairro ? ` · ${l.bairro}` : ''}
                    {l.orcamentoEstimado ? ` · ${brl(l.orcamentoEstimado)}` : ''}
                    {l.precisaMedicao ? ' · precisa medição' : ''}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <select aria-label={`Status de ${l.nomeEmpresa}`} value={l.status} onChange={(e) => mover(l.id, e.target.value)} className="campo py-1 text-xs">
                      {Object.entries(ROTULO).map(([v, r]) => (
                        <option key={v} value={v}>
                          {r}
                        </option>
                      ))}
                      <option value="PERDIDO">Perdido</option>
                    </select>
                    <button type="button" className="botao-wa px-2 py-1 text-xs" onClick={() => whatsapp(l.id)}>
                      WhatsApp
                    </button>
                    <a className="botao-sec px-2 py-1 text-xs" href={urlDownload(`/pdf/leads-b2b/${l.id}/proposta`)} download>
                      Proposta PDF
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
