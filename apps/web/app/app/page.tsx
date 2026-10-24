import Link from 'next/link';
import { EMPRESA } from '@/lib/empresa';
import { brl, data, ROTULO_ETAPA, type Etapa } from '@/lib/formato';
import { apiServidor } from '@/lib/servidor';

interface Dashboard {
  kpis: { orcamentosMes: { quantidade: number; valor: number }; osEmProducao: number; valorAReceber: number; entregasNoPrazoPct: number | null };
  funil: { etapa: Etapa; quantidade: number; valor: number; conversaoPct: number }[];
  fluxoCaixa: { recebidoSemana: number; aReceberAteFimMes: number; aReceberTotal: number; emAtraso: number; porForma: Record<'PIX' | 'CARTAO' | 'PARCELADO', number> };
  atencaoHoje: {
    osAtrasadas: { id: string; codigo: string; ambiente: string; atrasoDias: number; cliente: { nome: string } }[];
    pagamentosPendentesMais7Dias: { id: string; valor: number; vencimento: string; ordemServico: { id: string; numero: number; cliente: { nome: string } } }[];
    medicoesHoje: { id: string; numero: number; ambiente: string; cliente: { nome: string } }[];
    clientesSemRespostaWhatsapp2Dias: { clienteId: string; nome?: string; ultimoEnvio: string }[];
  };
}

function Kpi({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="cartao">
      <p className="rotulo">{rotulo}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{valor}</p>
      {detalhe && <p className="text-xs text-stone-500">{detalhe}</p>}
    </div>
  );
}

export default async function PaginaDashboard() {
  const d = await apiServidor<Dashboard>('/dashboard');
  const maxFunil = Math.max(1, ...d.funil.map((f) => f.quantidade));
  const a = d.atencaoHoje;
  return (
    <div className="space-y-6">
      <h1 className="titulo-pagina">Dashboard</h1>

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi rotulo="Orçamentos no mês" valor={brl(d.kpis.orcamentosMes.valor)} detalhe={`${d.kpis.orcamentosMes.quantidade} orçamentos`} />
        <Kpi rotulo="OS em produção" valor={String(d.kpis.osEmProducao)} />
        <Kpi rotulo="Valor a receber" valor={brl(d.kpis.valorAReceber)} />
        <Kpi rotulo="Entregas no prazo" valor={d.kpis.entregasNoPrazoPct === null ? '—' : `${d.kpis.entregasNoPrazoPct}%`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="cartao" aria-labelledby="t-funil">
          <h2 id="t-funil" className="font-semibold">
            Funil: orçamento → recebimento
          </h2>
          <ol className="mt-4 space-y-2">
            {d.funil.map((f) => (
              <li key={f.etapa} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-sm">
                <span>{ROTULO_ETAPA[f.etapa]}</span>
                <span className="h-5 overflow-hidden rounded bg-stone-200">
                  <span className="block h-full rounded bg-marca" style={{ width: `${(f.quantidade / maxFunil) * 100}%` }} />
                </span>
                <span className="tabular-nums text-stone-600">
                  {f.quantidade} · {brl(f.valor)} · {f.conversaoPct}%
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="cartao" aria-labelledby="t-atencao">
          <h2 id="t-atencao" className="font-semibold">
            Precisa de atenção hoje
          </h2>
          <div className="mt-3 space-y-4 text-sm">
            <div>
              <p className="rotulo">OS atrasadas ({a.osAtrasadas.length})</p>
              <ul className="mt-1 space-y-1">
                {a.osAtrasadas.map((o) => (
                  <li key={o.id}>
                    <Link href={`/app/os/${o.id}`} className="text-marca-escura underline-offset-2 hover:underline">
                      {o.codigo}
                    </Link>{' '}
                    {o.cliente.nome} · {o.ambiente} · <span className="font-semibold text-red-700">{o.atrasoDias} dia(s)</span>
                  </li>
                ))}
                {a.osAtrasadas.length === 0 && <li className="text-stone-500">Nenhuma 🎉</li>}
              </ul>
            </div>
            <div>
              <p className="rotulo">Pagamentos pendentes há +7 dias ({a.pagamentosPendentesMais7Dias.length})</p>
              <ul className="mt-1 space-y-1">
                {a.pagamentosPendentesMais7Dias.map((p) => (
                  <li key={p.id}>
                    <Link href={`/app/os/${p.ordemServico.id}`} className="text-marca-escura hover:underline">
                      OS-{p.ordemServico.numero}
                    </Link>{' '}
                    {p.ordemServico.cliente.nome} · {brl(p.valor)} · venceu {data(p.vencimento)}
                  </li>
                ))}
                {a.pagamentosPendentesMais7Dias.length === 0 && <li className="text-stone-500">Nenhum</li>}
              </ul>
            </div>
            <div>
              <p className="rotulo">Medições hoje ({a.medicoesHoje.length})</p>
              <ul className="mt-1 space-y-1">
                {a.medicoesHoje.map((m) => (
                  <li key={m.id}>
                    OS-{m.numero} · {m.cliente.nome} · {m.ambiente}
                  </li>
                ))}
                {a.medicoesHoje.length === 0 && <li className="text-stone-500">Nenhuma</li>}
              </ul>
            </div>
            <div>
              <p className="rotulo">Clientes sem resposta no WhatsApp há 2 dias ({a.clientesSemRespostaWhatsapp2Dias.length})</p>
              <ul className="mt-1 space-y-1">
                {a.clientesSemRespostaWhatsapp2Dias.map((c) => (
                  <li key={c.clienteId}>
                    {c.nome} · último envio {data(c.ultimoEnvio)}
                  </li>
                ))}
                {a.clientesSemRespostaWhatsapp2Dias.length === 0 && <li className="text-stone-500">Nenhum</li>}
              </ul>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="cartao" aria-labelledby="t-caixa">
          <h2 id="t-caixa" className="font-semibold">
            Fluxo de caixa
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="rotulo">Recebido (7 dias)</dt>
              <dd className="text-xl font-semibold text-green-700 tabular-nums">{brl(d.fluxoCaixa.recebidoSemana)}</dd>
            </div>
            <div>
              <dt className="rotulo">A receber até o fim do mês</dt>
              <dd className="text-xl font-semibold tabular-nums">{brl(d.fluxoCaixa.aReceberAteFimMes)}</dd>
            </div>
            <div>
              <dt className="rotulo">Em atraso</dt>
              <dd className="text-xl font-semibold text-red-700 tabular-nums">{brl(d.fluxoCaixa.emAtraso)}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <p className="rotulo">Recebido por forma</p>
            <div className="mt-2 flex h-4 overflow-hidden rounded">
              <span className="bg-marca" style={{ width: `${d.fluxoCaixa.porForma.PIX}%` }} title="PIX" />
              <span className="bg-stone-500" style={{ width: `${d.fluxoCaixa.porForma.CARTAO}%` }} title="Cartão" />
              <span className="bg-amber-400" style={{ width: `${d.fluxoCaixa.porForma.PARCELADO}%` }} title="Parcelado" />
            </div>
            <p className="mt-1 text-xs text-stone-600">
              PIX {d.fluxoCaixa.porForma.PIX}% · Cartão {d.fluxoCaixa.porForma.CARTAO}% · Parcelado {d.fluxoCaixa.porForma.PARCELADO}%
            </p>
          </div>
        </section>
        <section className="cartao text-sm" aria-labelledby="t-google">
          <h2 id="t-google" className="font-semibold">
            Google Meu Negócio
          </h2>
          <p className="mt-1 text-stone-600">{EMPRESA.endereco}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a className="botao-sec" href={EMPRESA.linkMapa} target="_blank" rel="noopener noreferrer">
              Ver no Maps
            </a>
            <a className="botao-sec" href={EMPRESA.linkRota} target="_blank" rel="noopener noreferrer">
              Rota
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
