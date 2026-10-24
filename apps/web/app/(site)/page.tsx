import Link from 'next/link';
import { CardColecao } from '@/components/CardColecao';
import { buscarComFallback, type Colecao } from '@/lib/api';
import { COLECOES_FALLBACK } from '@/lib/catalogo-fallback';
import { linkWhatsApp } from '@/lib/empresa';

export const revalidate = 300;

export default async function Inicio() {
  const colecoes = await buscarComFallback<Colecao[]>('/catalogo/colecoes', COLECOES_FALLBACK);
  return (
    <>
      <section className="bg-marca-clara">
        <div className="container-site py-16">
          <h1 className="max-w-2xl text-3xl font-bold text-marca-escura md:text-5xl">Móveis planejados, mármore e madeira sob medida no Rio.</h1>
          <p className="mt-4 max-w-xl text-stone-700">Do primeiro contato à instalação: projeto, cálculo exato de chapas, produção própria na Zona Norte e prazo acompanhado.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/colecoes" className="rounded-lg bg-marca px-5 py-3 font-semibold text-white hover:bg-marca-escura">
              Ver coleções
            </Link>
            <a href={linkWhatsApp('Olá! Quero um orçamento de móveis planejados.')} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-marca px-5 py-3 font-semibold text-marca-escura">
              Pedir orçamento no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="container-site py-12">
        <h2 className="text-2xl font-semibold">Coleções</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {colecoes.map((c) => (
            <CardColecao key={c.slug} colecao={c} />
          ))}
        </div>
      </section>

      <section className="container-site grid gap-6 py-6 md:grid-cols-3">
        {['Cozinha planejada premium', 'Closet e dressing', 'Bancadas em mármore e granito'].map((s) => (
          <div key={s} className="rounded-xl bg-stone-50 p-6">
            <h3 className="font-semibold">{s}</h3>
            <p className="mt-1 text-sm text-stone-600">Produção em 15 a 25 dias, com acompanhamento da OS pelo WhatsApp.</p>
          </div>
        ))}
      </section>
    </>
  );
}
