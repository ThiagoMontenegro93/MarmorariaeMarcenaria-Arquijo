import { formatarReais, type Colecao } from '@/lib/api';

export function CardColecao({ colecao }: { colecao: Colecao }) {
  return (
    <article className={`flex flex-col rounded-xl border p-6 ${colecao.destaque ? 'border-marca shadow-md' : 'border-stone-200'}`}>
      {colecao.destaque && <span className="mb-2 w-fit rounded bg-marca px-2 py-0.5 text-xs text-white">Mais vendida</span>}
      <h3 className="text-xl font-semibold text-marca-escura">{colecao.nome}</h3>
      <p className="mt-2 flex-1 text-sm text-stone-600">{colecao.descricao}</p>
      <p className="mt-4 text-sm">
        a partir de <strong className="text-lg">{formatarReais(colecao.precoAPartirDe)}</strong>/ambiente
      </p>
    </article>
  );
}
