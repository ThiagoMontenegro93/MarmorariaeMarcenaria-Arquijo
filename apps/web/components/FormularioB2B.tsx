'use client';

import { useState, type FormEvent } from 'react';
import { API_URL } from '@/lib/api';

type Estado = { tipo: 'ocioso' } | { tipo: 'enviando' } | { tipo: 'ok'; mensagem: string } | { tipo: 'erro'; mensagem: string };

/** Formulário de prospecção B2B → POST /leads-b2b (validação também no servidor). */
export function FormularioB2B() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'ocioso' });

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const orcamento = String(f.get('orcamentoEstimado') ?? '').trim();
    const corpo = {
      tipo: f.get('tipo'),
      nomeEmpresa: f.get('nomeEmpresa'),
      cnpj: f.get('cnpj'),
      responsavel: f.get('responsavel'),
      whatsapp: f.get('whatsapp'),
      unidades: Number(f.get('unidades')),
      prazoDesejado: f.get('prazoDesejado') || undefined,
      bairro: f.get('bairro') || undefined,
      orcamentoEstimado: orcamento ? Number(orcamento) : undefined,
      precisaMedicao: f.get('precisaMedicao') === 'on',
      consentimentoLgpd: f.get('consentimentoLgpd') === 'on',
      site: f.get('site') || undefined,
    };
    setEstado({ tipo: 'enviando' });
    try {
      const r = await fetch(`${API_URL}/leads-b2b`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
      const dados = await r.json().catch(() => ({}));
      if (r.ok) {
        setEstado({ tipo: 'ok', mensagem: dados.mensagem ?? 'Recebemos seu contato!' });
        (e.target as HTMLFormElement).reset();
      } else {
        const msg = Array.isArray(dados.message) ? dados.message.join(' ') : (dados.message ?? 'Não foi possível enviar.');
        setEstado({ tipo: 'erro', mensagem: r.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos.' : msg });
      }
    } catch {
      setEstado({ tipo: 'erro', mensagem: 'Falha de conexão. Tente novamente ou fale pelo WhatsApp.' });
    }
  }

  const campo = 'mt-1 w-full rounded-lg border border-stone-300 px-3 py-2';
  return (
    <form onSubmit={enviar} className="grid gap-4 rounded-xl border border-stone-200 p-6 md:grid-cols-2">
      <label className="text-sm">
        Tipo de empresa
        <select name="tipo" required className={campo}>
          <option value="IMOBILIARIA">Imobiliária</option>
          <option value="CONSTRUTORA">Construtora</option>
          <option value="EMPREITEIRA">Empreiteira</option>
        </select>
      </label>
      <label className="text-sm">
        Nome da empresa
        <input name="nomeEmpresa" required minLength={2} maxLength={150} className={campo} />
      </label>
      <label className="text-sm">
        CNPJ
        <input name="cnpj" required inputMode="numeric" placeholder="00.000.000/0000-00" className={campo} />
      </label>
      <label className="text-sm">
        Responsável
        <input name="responsavel" required maxLength={120} className={campo} />
      </label>
      <label className="text-sm">
        WhatsApp
        <input name="whatsapp" required inputMode="tel" placeholder="(21) 90000-0000" className={campo} />
      </label>
      <label className="text-sm">
        Nº de unidades/ambientes
        <input name="unidades" type="number" min={1} max={10000} required className={campo} />
      </label>
      <label className="text-sm">
        Prazo desejado
        <input name="prazoDesejado" maxLength={60} placeholder="ex.: 60 dias" className={campo} />
      </label>
      <label className="text-sm">
        Bairro (Rio)
        <input name="bairro" maxLength={80} className={campo} />
      </label>
      <label className="text-sm">
        Orçamento estimado (R$)
        <input name="orcamentoEstimado" type="number" min={0} step="0.01" className={campo} />
      </label>
      {/* Honeypot anti-robô: invisível para pessoas. */}
      <input name="site" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex items-center gap-2 self-end text-sm">
        <input name="precisaMedicao" type="checkbox" /> Precisa de medição na obra?
      </label>
      <label className="flex items-start gap-2 text-sm md:col-span-2">
        <input name="consentimentoLgpd" type="checkbox" required className="mt-1" />
        Autorizo o uso destes dados para contato comercial pela Arquijo, conforme a LGPD.
      </label>
      <div className="md:col-span-2">
        <button disabled={estado.tipo === 'enviando'} className="rounded-lg bg-marca px-5 py-3 font-semibold text-white disabled:opacity-60">
          {estado.tipo === 'enviando' ? 'Enviando…' : 'Solicitar proposta'}
        </button>
        {estado.tipo === 'ok' && <p role="status" className="mt-3 text-green-700">{estado.mensagem}</p>}
        {estado.tipo === 'erro' && <p role="alert" className="mt-3 text-red-700">{estado.mensagem}</p>}
      </div>
    </form>
  );
}
