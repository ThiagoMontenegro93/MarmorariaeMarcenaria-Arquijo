import type { Metadata } from 'next';
import { EMPRESA, linkWhatsApp } from '@/lib/empresa';

export const metadata: Metadata = { title: 'Contato e como chegar' };

export default function Contato() {
  return (
    <div className="container-site grid gap-8 py-12 md:grid-cols-2">
      <section>
        <h1 className="text-3xl font-bold text-marca-escura">Contato</h1>
        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="font-semibold">Endereço</dt>
            <dd>{EMPRESA.endereco}</dd>
          </div>
          <div>
            <dt className="font-semibold">Telefone / WhatsApp</dt>
            <dd>{EMPRESA.telefone}</dd>
          </div>
          <div>
            <dt className="font-semibold">Horário</dt>
            <dd>{EMPRESA.horario}</dd>
          </div>
          <div>
            <dt className="font-semibold">Atendimento</dt>
            <dd>{EMPRESA.areaAtendimento}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={EMPRESA.linkMapa} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-marca px-4 py-2 text-sm font-semibold text-white">
            Ver no Google Maps
          </a>
          <a href={EMPRESA.linkRota} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-marca px-4 py-2 text-sm font-semibold text-marca-escura">
            Como chegar
          </a>
          <a href={EMPRESA.linkGoogle} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-stone-300 px-4 py-2 text-sm">
            Perfil no Google
          </a>
          <a href={linkWhatsApp()} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-whatsapp px-4 py-2 text-sm font-semibold text-white">
            WhatsApp
          </a>
        </div>
      </section>
      <section aria-label="Mapa" className="flex min-h-64 flex-col items-center justify-center rounded-xl bg-stone-100 p-6 text-center text-sm text-stone-600">
        {/* Mapa estático/embarcado entra quando houver GOOGLE_MAPS_API_KEY (Fase 2); por ora, link direto. */}
        <span className="text-4xl" aria-hidden>📍</span>
        <p className="mt-2">
          {EMPRESA.coordenadas.lat}, {EMPRESA.coordenadas.lng}
        </p>
        <p>Google Place ID {EMPRESA.googlePlaceId}</p>
      </section>
    </div>
  );
}
