'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/cliente-api';

interface Opcao {
  id: string;
  nome: string;
}

export function NovaOs({ aoCriar }: { aoCriar: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [clientes, setClientes] = useState<Opcao[]>([]);
  const [projetos, setProjetos] = useState<Opcao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    void api<{ itens: Opcao[] }>('/clientes?porPagina=100').then((r) => setClientes(r.itens)).catch(() => setClientes([]));
    void api<Opcao[]>('/projetos').then(setProjetos).catch(() => setProjetos([]));
  }, [aberto]);

  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const valor = String(f.get('valorTotal') ?? '').trim();
    const prazo = String(f.get('prazoAcordado') ?? '');
    setEnviando(true);
    setErro(null);
    try {
      await api('/ordens-servico', {
        method: 'POST',
        json: {
          clienteId: f.get('clienteId'),
          projetoId: f.get('projetoId') || undefined,
          ambiente: f.get('ambiente'),
          prioridade: f.get('prioridade'),
          prazoAcordado: prazo ? new Date(`${prazo}T12:00:00-03:00`).toISOString() : undefined,
          valorTotal: valor ? Number(valor) : undefined,
        },
      });
      setAberto(false);
      aoCriar();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button type="button" className="botao" onClick={() => setAberto(true)}>
        + Nova OS
      </button>
    );
  }
  return (
    <form onSubmit={criar} className="cartao grid w-full gap-3 md:grid-cols-3">
      <label>
        <span className="rotulo">Cliente</span>
        <select name="clienteId" required className="campo mt-1">
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="rotulo">Projeto (calcula chapas)</span>
        <select name="projetoId" className="campo mt-1">
          <option value="">— sem projeto —</option>
          {projetos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="rotulo">Ambiente</span>
        <input name="ambiente" required minLength={2} className="campo mt-1" />
      </label>
      <label>
        <span className="rotulo">Prioridade</span>
        <select name="prioridade" defaultValue="NORMAL" className="campo mt-1">
          <option value="BAIXA">Baixa</option>
          <option value="NORMAL">Normal</option>
          <option value="ALTA">Alta</option>
          <option value="EMERGENCIAL">Emergencial</option>
        </select>
      </label>
      <label>
        <span className="rotulo">Prazo acordado</span>
        <input name="prazoAcordado" type="date" className="campo mt-1" />
      </label>
      <label>
        <span className="rotulo">Valor total (vazio = prévia do projeto)</span>
        <input name="valorTotal" type="number" min={0} step="0.01" className="campo mt-1" />
      </label>
      {erro && (
        <p role="alert" className="text-sm text-red-700 md:col-span-3">
          {erro}
        </p>
      )}
      <div className="flex gap-2 md:col-span-3">
        <button className="botao" disabled={enviando}>
          {enviando ? 'Criando…' : 'Criar OS'}
        </button>
        <button type="button" className="botao-sec" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
