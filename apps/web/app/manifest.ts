import type { MetadataRoute } from 'next';

/** Manifest do PWA (instalável no celular do marceneiro). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Arquijo — Medição na obra',
    short_name: 'Arquijo',
    description: 'Medição offline, fotos e acompanhamento de OS da Arquijo Marmoraria e Marcenaria.',
    start_url: '/app/medicao',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#efede8',
    theme_color: '#8f5e30',
    lang: 'pt-BR',
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
