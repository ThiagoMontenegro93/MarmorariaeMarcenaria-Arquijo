'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, urlDownload } from '@/lib/cliente-api';
import { brl, COR_ETAPA, data, dataHora, ESTILO_PRIORIDADE, ETAPAS, ROTULO_ETAPA, ROTULO_PRIORIDADE } from '@/lib/formato';
import type { OsDetalhe } from './tipos';

export function DetalheOs({ id, podeFinanceiro }: { id: string; podeFinanceiro: boolean }) {
  const [os, setOs] = useState<OsDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setOs(await api<OsDetalhe>(`/ordens-servico/${id}`));
    } catch (e) {
      setErro((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function executar(acao: () => Promise<unknown>, msg?: string) {
    setOcupado(true);
    setErro(null);
    setAviso(null);
    try {
      await acao();
      await carregar();
      if (msg) setAviso(msg);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  async function whatsapp() {
    await executar(async () => {
      const r = await api<{ link: string }>('/whatsapp/link', { method: 'POST', json: { contexto: 'OS', id } });
      window.open(r.link, '_blank', 'noopener,noreferrer');
    }, 'Mensagem gerada e registrada no histórico.');
  }

  async function registrarPagamento(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const venc = String(f.get('vencimento') ?? '');
    await executar(async () => {
      await api('/pagamentos', {
        method: 'POST',
        json: {
          ordemServicoId: id,
          tipo: f.get('tipo'),
          forma: f.get('forma'),
          valor: Number(f.get('valor')),
          vencimento: venc ? new Date(`${venc}T12:00:00-03:00`).toISOString() : undefined,
          pago: f.get('pago') === 'on',
        },
      });
      form.reset();
    }, 'Pagamento registrado.');
  }

  if (erro && !os) return <p role="alert" className="text-red-700">{erro}</p>;
  if (!os) return <p className="text-sm text-stone-500">Carregando…</p>;

  const indiceAtual = ETAPAS.indexOf(os.status);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/app/os" className="text-sm text-stone-500 hover:underline">
            ← Ordens de serviço
          </Link>
          <h1 className="titulo-pagina mt-1 flex items-center gap-3">
            {os.codigo} · {os.ambiente}
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTILO_PRIORIDADE[os.prioridade]}`}>{ROTULO_PRIORIDADE[os.prioridade]}</span>
          </h1>
          <p className="text-sm text-stone-600">
            {os.cliente.nome} · etapa <strong data-testid="etapa-atual">{ROTULO_ETAPA[os.status]}</strong>
            {os.atrasoDias > 0 && <span className="ml-2 font-semibold text-red-700">{os.atrasoDias} dia(s) de atraso</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {os.status !== 'FINALIZADO' && (
            <button type="button" className="botao" disabled={ocupado} onClick={() => executar(() => api(`/ordens-servico/${id}/avancar`, { method: 'PATCH', json: {} }), 'Etapa avançada.')}>
              Mover para {ROTULO_ETAPA[ETAPAS[indiceAtual + 1] ?? 'FINALIZADO']} →
            </button>
          )}
          <button type="button" className="botao-wa" disabled={ocupado} onClick={whatsapp}>
            Enviar atualização no WhatsApp
          </button>
          <a className="botao-sec" href={urlDownload(`/pdf/ordens-servico/${id}`)} download>
            Baixar OS (PDF)
          </a>
        </div>
      </div>

      {erro && <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</p>}
      {aviso && <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">{aviso}</p>}

      <section className="cartao" aria-labelledby="t-timeline">
        <h2 id="t-timeline" className="font-semibold">
          Timeline
        </h2>
        <ol className="mt-4 flex gap-1 overflow-x-auto">
          {ETAPAS.map((etapa, i) => {
            const passo = os.timeline.find((t) => t.etapa === etapa);
            const feito = i <= indiceAtual;
            return (
              <li key={etapa} className="min-w-[110px] flex-1">
                <div className={`h-2 rounded ${feito ? COR_ETAPA[etapa] : 'bg-stone-200'}`} />
                <p className={`mt-1 text-xs ${i === indiceAtual ? 'font-semibold' : 'text-stone-600'}`}>{ROTULO_ETAPA[etapa]}</p>
                {passo && (
                  <p className="text-[11px] text-stone-500">
                    {dataHora(passo.entrouEm)} · {passo.duracaoHoras}h
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="rotulo">Orçamento</dt>
            <dd>{data(os.dataOrcamento)}</dd>
          </div>
          <div>
            <dt className="rotulo">Aprovação</dt>
            <dd>{data(os.dataAprovacao)}</dd>
          </div>
          <div>
            <dt className="rotulo">Prazo acordado</dt>
            <dd>{data(os.prazoAcordado)}</dd>
          </div>
          <div>
            <dt className="rotulo">Entrega real</dt>
            <dd>{data(os.prazoReal)}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="cartao" aria-labelledby="t-fin">
          <h2 id="t-fin" className="font-semibold">
            Financeiro
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="rotulo">Total</dt>
              <dd className="tabular-nums">{brl(os.valorTotal)}</dd>
            </div>
            <div>
              <dt className="rotulo">Entrada (50%)</dt>
              <dd className="tabular-nums">{brl(os.valorEntrada)}</dd>
            </div>
            <div>
              <dt className="rotulo">Recebido</dt>
              <dd className="tabular-nums text-green-700" data-testid="valor-recebido">
                {brl(os.valorRecebido)}
              </dd>
            </div>
            <div>
              <dt className="rotulo">Status</dt>
              <dd data-testid="status-financeiro">{os.statusFinanceiro}</dd>
            </div>
          </dl>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs text-stone-500">
              <tr>
                <th className="py-1">Tipo</th>
                <th>Forma</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {os.pagamentos.map((p) => (
                <tr key={p.id} className="border-t border-linha">
                  <td className="py-1">{p.tipo === 'ENTRADA' ? 'Entrada' : 'Parcela'}</td>
                  <td>{p.forma}</td>
                  <td className="tabular-nums">{brl(p.valor)}</td>
                  <td>{data(p.vencimento)}</td>
                  <td>{p.status === 'PAGO' ? `Pago ${data(p.pagoEm)}` : p.status}</td>
                  <td className="text-right">
                    {podeFinanceiro && p.status === 'PENDENTE' && (
                      <button type="button" className="text-xs text-marca-escura underline" disabled={ocupado} onClick={() => executar(() => api(`/pagamentos/${p.id}/confirmar`, { method: 'PATCH', json: {} }), 'Pagamento confirmado.')}>
                        Confirmar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {os.pagamentos.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-2 text-stone-500">
                    Nenhum pagamento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {podeFinanceiro && (
            <>
              {os.pagamentos.length === 0 && Number(os.valorTotal) > 0 && (
                <button type="button" className="botao-sec mt-3" disabled={ocupado} onClick={() => executar(() => api(`/pagamentos/plano-padrao/${id}`, { method: 'POST', json: { forma: 'PIX' } }), 'Plano 50% + saldo gerado.')}>
                  Gerar entrada 50% + saldo (PIX)
                </button>
              )}
              <form onSubmit={registrarPagamento} className="mt-4 grid gap-2 border-t border-linha pt-3 sm:grid-cols-3" aria-label="Registrar pagamento">
                <select name="tipo" className="campo" aria-label="Tipo">
                  <option value="ENTRADA">Entrada</option>
                  <option value="PARCELA">Parcela</option>
                </select>
                <select name="forma" className="campo" aria-label="Forma">
                  <option value="PIX">PIX</option>
                  <option value="CARTAO">Cartão</option>
                  <option value="PARCELADO">Parcelado</option>
                </select>
                <input name="valor" type="number" min={0.01} step="0.01" required placeholder="Valor (R$)" className="campo" aria-label="Valor" />
                <input name="vencimento" type="date" className="campo" aria-label="Vencimento" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="pago" /> Já recebido
                </label>
                <button className="botao" disabled={ocupado}>
                  Registrar pagamento
                </button>
              </form>
            </>
          )}
        </section>

        <section className="cartao space-y-4" aria-labelledby="t-mat">
          <div>
            <h2 id="t-mat" className="font-semibold">
              Materiais vinculados
            </h2>
            {os.materiais ? (
              <p className="mt-1 text-sm">
                {os.materiais.totalChapas} chapa(s) · aproveitamento {os.materiais.aproveitamentoGeralPct}% ·{' '}
                {os.materiais.listaCompra.length ? `comprar: ${os.materiais.listaCompra.map((i) => `${i.quantidade}× ${i.nome}`).join(', ')}` : 'tudo em estoque'}
              </p>
            ) : (
              <p className="mt-1 text-sm text-stone-500">OS sem projeto vinculado.</p>
            )}
            {os.projeto && (
              <Link href={`/app/projetos/${os.projeto.id}`} className="text-sm text-marca-escura underline">
                Abrir projeto {os.projeto.nome}
              </Link>
            )}
          </div>
          <div>
            <h3 className="font-semibold">Histórico WhatsApp</h3>
            <ul className="mt-2 max-h-60 space-y-2 overflow-y-auto text-sm">
              {os.mensagens.map((m) => (
                <li key={m.id} className="rounded bg-green-50 p-2">
                  <p className="text-[11px] text-stone-500">
                    {dataHora(m.criadoEm)} · {m.canal === 'LINK_WA_ME' ? 'link wa.me' : 'Business API'}
                  </p>
                  <p className="whitespace-pre-line">{m.mensagem}</p>
                </li>
              ))}
              {os.mensagens.length === 0 && <li className="text-stone-500">Nenhuma mensagem.</li>}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
