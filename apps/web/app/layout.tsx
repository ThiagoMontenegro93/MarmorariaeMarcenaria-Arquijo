import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Arquijo Marmoraria e Marcenaria — móveis planejados no Rio', template: '%s · Arquijo' },
  description: 'Móveis planejados, marmoraria e marcenaria de alto padrão no Rio de Janeiro. Cozinhas, closets, painéis e bancadas.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icone-192.png', apple: '/icone-192.png' },
  appleWebApp: { capable: true, title: 'Arquijo', statusBarStyle: 'default' },
};

export const viewport: Viewport = { themeColor: '#8f5e30', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
