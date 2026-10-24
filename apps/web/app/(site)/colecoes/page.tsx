import type { Metadata } from 'next';
import { CardColecao } from '@/components/CardColecao';
import { buscarComFallback, formatarReais, type Colecao, type Modelo } from '@/lib/api';
import { COLECOES_FALLBACK, MODELOS_FALLBACK } from '@/lib/catalogo-fallback';
import { linkWhatsApp } from '@/lib/empresa';

export const metadata: Metadata = { title: 'Coleções e modelos' };
export const revalidate = 300;

export default async function Colecoes() {
  const [colecoes, modelos] = await Promise.all([
    buscarComFallback<Colecao[]>('/catalogo/colecoes', COLECOES_FALLBACK),
    buscarComFallback<Modelo[]>('/catalogo/modelos', MODELOS_FALLBACK),
  ]);
  return (
    <div className="container-site py-12">
      <h1 className="text-3xl font-bold text-marca-escura">Coleções</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {colecoes.map((c) => (
          <CardColecao key={c.slug} colecao={c} />
        ))}
      </div>

      <h2 className="mt-14 text-2xl font-semibold">Modelos prontos por ambiente</h2>
      <p className="text-sm text-stone-600">Medidas adaptáveis ao seu espaço · produção em 15 a 25 dias.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modelos.map((m) => (
          <article key={m.slug} className="flex flex-col rounded-xl border border-stone-200 p-4">
            <span className="text-xs uppercase tracking-wide text-stone-500">{m.ambiente}</span>
            <h3 className="mt-1 font-semibold">{m.nome}</h3>
            <p className="mt-1 flex-1 text-sm text-stone-600">
              {m.materiais}
              {m.areaM2 ? ` · ${Number(m.areaM2)} m²` : ''}
            </p>
            <p className="mt-3 font-semibold">{m.sobConsulta || m.preco == null ? 'Sob consulta' : formatarReais(m.preco)}</p>
            <a
              href={linkWhatsApp(`Olá! Quero o modelo "${m.nome}". Pode me passar mais detalhes?`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 rounded-lg bg-whatsapp px-3 py-2 text-center text-sm font-semibold text-white"
            >
              Quero este modelo
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
