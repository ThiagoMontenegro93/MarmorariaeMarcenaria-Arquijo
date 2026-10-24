import type { Metadata } from 'next';
import { FormularioB2B } from '@/components/FormularioB2B';
import { EMPRESA } from '@/lib/empresa';

export const metadata: Metadata = { title: 'Para imobiliárias, construtoras e empreiteiras' };

const VERTICAIS = [
  {
    titulo: 'Para Imobiliárias',
    texto: 'Valorize imóveis com planejados para decorados e locação: pacote cozinha + closets para 40-80m², entrega em 20 dias e fotos prontas para anúncio.',
  },
  {
    titulo: 'Para Construtoras',
    texto: 'Marcenaria em escala para empreendimentos: pacotes de 10, 50 ou 100 unidades, desconto progressivo de até 25%, acompanhamento de obra e garantia de 5 anos.',
  },
  {
    titulo: 'Para Empreiteiras',
    texto: 'Terceirize a marcenaria com SLA: fornecimento sob demanda de MDF e pedras e equipe de instalação própria.',
  },
];

export default function Empresas() {
  return (
    <div className="container-site py-12">
      <h1 className="text-3xl font-bold text-marca-escura">Marcenaria e marmoraria para empresas</h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        Marcenaria própria na Zona Norte, entrega em {EMPRESA.areaAtendimento.toLowerCase()} e capacidade para 50 projetos simultâneos.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {VERTICAIS.map((v) => (
          <article key={v.titulo} className="rounded-xl bg-marca-clara p-6">
            <h2 className="font-semibold text-marca-escura">{v.titulo}</h2>
            <p className="mt-2 text-sm text-stone-700">{v.texto}</p>
          </article>
        ))}
      </div>
      <h2 className="mt-12 text-2xl font-semibold">Solicite uma proposta</h2>
      <div className="mt-4">
        <FormularioB2B />
      </div>
    </div>
  );
}
