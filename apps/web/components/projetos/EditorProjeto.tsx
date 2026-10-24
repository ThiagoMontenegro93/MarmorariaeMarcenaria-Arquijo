'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, urlDownload } from '@/lib/cliente-api';
import { ResultadoCalculoView } from './ResultadoCalculoView';
import type { Chapa, Ferragem, LinhaPeca, PreviaCusto, Projeto, ResultadoCalculo } from './tipos';

export function EditorProjeto({ id }: { id: string }) {
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [chapas, setChapas] = useState<Chapa[]>([]);
  const [linhas, setLinhas] = useState<LinhaPeca[]>([]);
  const [ferragens, setFerragens] = useState<Ferragem[]>([]);
  const [params, setParams] = useState({ espessuraSerraMm: 4, precoFitaPorMetro: 2.5, horasMaoDeObra: 0, valorHora: 0, margemPct: 30 });
  const [resultado, setResultado] = useState<{ r: ResultadoCalculo; p: PreviaCusto | null; ms?: number } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [p, cs] = await Promise.all([api<Projeto>(`/projetos/${id}`), api<Chapa[]>('/chapas')]);
        setProjeto(p);
        setChapas(cs);
        setLinhas(p.pecas.map(({ nome, larguraMm, alturaMm, quantidade, chapaId, veio }) => ({ nome, larguraMm, alturaMm, quantidade, chapaId, veio })));
        setFerragens(p.ferragens ?? []);
        setParams({
          espessuraSerraMm: p.espessuraSerraMm,
          precoFitaPorMetro: Number(p.precoFitaPorMetro),
          horasMaoDeObra: Number(p.horasMaoDeObra),
          valorHora: Number(p.valorHora),
          margemPct: Number(p.margemPct),
        });
        if (p.resultadoCalculo) setResultado({ r: p.resultadoCalculo, p: p.previaCusto });
      } catch (e) {
        setErro((e as Error).message);
      }
    })();
  }, [id]);

  function alterar(i: number, campo: keyof LinhaPeca, valor: string | boolean) {
    setLinhas((ls) =>
      ls.map((l, j) => (j !== i ? l : { ...l, [campo]: typeof valor === 'boolean' || campo === 'nome' || campo === 'chapaId' ? valor : Number(valor) })),
    );
  }

  async function salvarECalcular() {
    setOcupado(true);
    setErro(null);
    try {
      await api(`/projetos/${id}`, { method: 'PATCH', json: { ...params, ferragens } });
      await api(`/projetos/${id}/pecas`, { method: 'PUT', json: { pecas: linhas } });
      const r = await api<{ resultado: ResultadoCalculo; previa: PreviaCusto; metrosFitaBorda: number; duracaoMs: number }>(`/projetos/${id}/calcular`, { method: 'POST', json: {} });
      setResultado({ r: r.resultado, p: { ...r.previa, metrosFitaBorda: r.metrosFitaBorda }, ms: r.duracaoMs });
    } catch (e) {
      setErro((e as Error).message);
      setResultado(null);
    } finally {
      setOcupado(false);
    }
  }

  if (!projeto) return erro ? <p role="alert" className="text-red-700">{erro}</p> : <p className="text-sm text-stone-500">Carregando…</p>;

  const campoNum = (k: keyof typeof params, rotulo: string, passo = '0.01') => (
    <label className="text-sm">
      <span className="rotulo">{rotulo}</span>
      <input type="number" min={0} step={passo} value={params[k]} onChange={(e) => setParams({ ...params, [k]: Number(e.target.value) })} className="campo mt-1" />
    </label>
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/projetos" className="text-sm text-stone-500 hover:underline">
          ← Projetos
        </Link>
        <h1 className="titulo-pagina mt-1">{projeto.nome}</h1>
        <p className="text-sm text-stone-600">
          {projeto.ambiente ?? 'Sem ambiente'} · {projeto.cliente?.nome ?? 'sem cliente'}
        </p>
      </div>

      <section className="cartao" aria-labelledby="t-cut">
        <h2 id="t-cut" className="font-semibold">
          Cut list
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs text-stone-500">
              <tr>
                <th>Peça</th>
                <th>Largura (mm)</th>
                <th>Altura (mm)</th>
                <th>Qtd</th>
                <th>Material (chapa)</th>
                <th>Veio</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => (
                <tr key={i} className="border-t border-linha">
                  <td className="py-1 pr-2">
                    <input aria-label={`Nome da peça ${i + 1}`} value={l.nome} onChange={(e) => alterar(i, 'nome', e.target.value)} className="campo" />
                  </td>
                  <td className="pr-2">
                    <input aria-label={`Largura ${i + 1}`} type="number" min={1} value={l.larguraMm} onChange={(e) => alterar(i, 'larguraMm', e.target.value)} className="campo" />
                  </td>
                  <td className="pr-2">
                    <input aria-label={`Altura ${i + 1}`} type="number" min={1} value={l.alturaMm} onChange={(e) => alterar(i, 'alturaMm', e.target.value)} className="campo" />
                  </td>
                  <td className="pr-2">
                    <input aria-label={`Quantidade ${i + 1}`} type="number" min={1} value={l.quantidade} onChange={(e) => alterar(i, 'quantidade', e.target.value)} className="campo w-20" />
                  </td>
                  <td className="pr-2">
                    <select aria-label={`Chapa ${i + 1}`} value={l.chapaId} onChange={(e) => alterar(i, 'chapaId', e.target.value)} className="campo">
                      {chapas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-center">
                    <input aria-label={`Veio ${i + 1}`} type="checkbox" checked={l.veio} onChange={(e) => alterar(i, 'veio', e.target.checked)} />
                  </td>
                  <td>
                    <button type="button" aria-label={`Remover peça ${i + 1}`} className="text-red-700" onClick={() => setLinhas((ls) => ls.filter((_, j) => j !== i))}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="botao-sec mt-3"
          onClick={() => setLinhas((ls) => [...ls, { nome: 'Peça', larguraMm: 500, alturaMm: 400, quantidade: 1, chapaId: chapas[0]?.id ?? '', veio: false }])}
        >
          + Adicionar peça
        </button>
      </section>

      <section className="cartao" aria-labelledby="t-custos">
        <h2 id="t-custos" className="font-semibold">
          Parâmetros de custo
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-5">
          {campoNum('espessuraSerraMm', 'Serra (mm)', '1')}
          {campoNum('precoFitaPorMetro', 'Fita R$/m')}
          {campoNum('horasMaoDeObra', 'Horas de mão de obra')}
          {campoNum('valorHora', 'Valor da hora (R$)')}
          {campoNum('margemPct', 'Margem (%)')}
        </div>
        <p className="rotulo mt-4">Ferragens</p>
        {ferragens.map((f, i) => (
          <div key={i} className="mt-1 grid grid-cols-[1fr_90px_120px_30px] gap-2">
            <input aria-label="Ferragem" value={f.nome} onChange={(e) => setFerragens(ferragens.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))} className="campo" />
            <input aria-label="Quantidade da ferragem" type="number" min={0} value={f.quantidade} onChange={(e) => setFerragens(ferragens.map((x, j) => (j === i ? { ...x, quantidade: Number(e.target.value) } : x)))} className="campo" />
            <input aria-label="Preço da ferragem" type="number" min={0} step="0.01" value={f.precoUnitario} onChange={(e) => setFerragens(ferragens.map((x, j) => (j === i ? { ...x, precoUnitario: Number(e.target.value) } : x)))} className="campo" />
            <button type="button" aria-label="Remover ferragem" className="text-red-700" onClick={() => setFerragens(ferragens.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="botao-sec mt-2" onClick={() => setFerragens([...ferragens, { nome: 'Dobradiça com amortecimento', quantidade: 2, precoUnitario: 18 }])}>
          + Ferragem
        </button>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="botao" disabled={ocupado || linhas.length === 0} onClick={salvarECalcular}>
          {ocupado ? 'Calculando…' : 'Calcular chapas necessárias'}
        </button>
        {resultado && (
          <>
            <a className="botao-sec" href={urlDownload(`/pdf/projetos/${id}/orcamento`)} download>
              Orçamento (PDF)
            </a>
            <a className="botao-sec" href={urlDownload(`/pdf/projetos/${id}/lista-compra`)} download>
              Lista de compra (PDF)
            </a>
          </>
        )}
        {erro && (
          <p role="alert" className="text-sm text-red-700">
            {erro}
          </p>
        )}
      </div>

      {resultado && <ResultadoCalculoView resultado={resultado.r} previa={resultado.p} duracaoMs={resultado.ms} />}
    </div>
  );
}
