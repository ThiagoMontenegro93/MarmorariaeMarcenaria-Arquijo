import { brl } from '@/lib/formato';
import { PlanoCorteSvg } from './PlanoCorteSvg';
import type { PreviaCusto, ResultadoCalculo } from './tipos';

export function ResultadoCalculoView({ resultado, previa, duracaoMs }: { resultado: ResultadoCalculo; previa: PreviaCusto | null; duracaoMs?: number }) {
  return (
    <div className="space-y-6" data-testid="resultado-calculo">
      <section className="grid gap-4 sm:grid-cols-4">
        <div className="cartao">
          <p className="rotulo">Chapas</p>
          <p className="font-display text-2xl font-semibold" data-testid="total-chapas">
            {resultado.totalChapas}
          </p>
        </div>
        <div className="cartao">
          <p className="rotulo">Aproveitamento</p>
          <p className="font-display text-2xl font-semibold">{resultado.aproveitamentoGeralPct}%</p>
        </div>
        <div className="cartao">
          <p className="rotulo">Desperdício</p>
          <p className="font-display text-2xl font-semibold">{resultado.desperdicioGeralPct}%</p>
        </div>
        <div className="cartao">
          <p className="rotulo">Valor final (prévia)</p>
          <p className="font-display text-2xl font-semibold" data-testid="valor-final">
            {previa ? brl(previa.valorFinal) : '—'}
          </p>
          {duracaoMs !== undefined && <p className="text-xs text-stone-500">calculado em {duracaoMs} ms</p>}
        </div>
      </section>

      {resultado.materiais.map((m) => (
        <section key={m.chapa.id} className="cartao">
          <h3 className="font-semibold">
            {m.chapa.nome} <span className="font-normal text-stone-500">({m.chapa.larguraMm}×{m.chapa.alturaMm} mm)</span>
          </h3>
          <p className="text-sm text-stone-600">
            {m.chapasUsadas} chapa(s): {m.qtdDoEstoque} do estoque, {m.qtdCompra} para comprar · aproveitamento {m.aproveitamentoPct}%
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {m.planos.map((p) => (
              <figure key={p.indice}>
                <figcaption className="mb-1 flex justify-between text-xs">
                  <span>
                    Chapa {p.indice + 1}{' '}
                    {p.indice < m.qtdDoEstoque ? (
                      <span className="rounded bg-stone-200 px-1">estoque</span>
                    ) : (
                      <span className="rounded bg-amber-100 px-1 text-amber-900">comprar</span>
                    )}
                  </span>
                  <span className="text-stone-500">
                    {p.pecas.length} peças · {p.aproveitamentoPct}%
                  </span>
                </figcaption>
                <PlanoCorteSvg chapa={m.chapa} pecas={p.pecas} sobras={p.sobras} titulo={`Chapa ${p.indice + 1}`} />
              </figure>
            ))}
          </div>
        </section>
      ))}

      <div className="grid gap-6 md:grid-cols-2">
        {previa && (
          <section className="cartao text-sm">
            <h3 className="font-semibold">Prévia de custo</h3>
            <dl className="mt-2 space-y-1">
              {(
                [
                  ['MDF', previa.custoMdf],
                  [`Fita de borda${previa.metrosFitaBorda ? ` (${previa.metrosFitaBorda} m)` : ''}`, previa.custoFita],
                  ['Ferragens', previa.custoFerragens],
                  ['Mão de obra', previa.custoMaoDeObra],
                  ['Custo total', previa.custoTotal],
                  [`Margem (${previa.margemPct}%)`, previa.margemValor],
                ] as [string, number][]
              ).map(([r, v]) => (
                <div key={r} className="flex justify-between">
                  <dt>{r}</dt>
                  <dd className="tabular-nums">{brl(v)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-linha pt-1 font-semibold">
                <dt>Valor final ao cliente</dt>
                <dd className="tabular-nums">{brl(previa.valorFinal)}</dd>
              </div>
            </dl>
          </section>
        )}
        <section className="cartao text-sm">
          <h3 className="font-semibold">Lista de compra</h3>
          {resultado.listaCompra.length === 0 ? (
            <p className="mt-2 text-stone-600">Tudo disponível em estoque.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {resultado.listaCompra.map((i) => (
                <li key={i.chapaId} className="flex justify-between">
                  <span>
                    {i.quantidade}× {i.nome}
                  </span>
                  <span className="tabular-nums">{brl(i.custoTotal)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
