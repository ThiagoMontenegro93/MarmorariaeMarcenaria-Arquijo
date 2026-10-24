import type { Metadata } from 'next';
import { BotaoWhatsappFlutuante } from '@/components/BotaoWhatsapp';
import { Cabecalho } from '@/components/Cabecalho';
import { Rodape } from '@/components/Rodape';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Arquijo Marmoraria e Marcenaria — móveis planejados no Rio', template: '%s · Arquijo' },
  description: 'Móveis planejados, marmoraria e marcenaria de alto padrão no Rio de Janeiro. Cozinhas, closets, painéis e bancadas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Cabecalho />
        <main>{children}</main>
        <Rodape />
        <BotaoWhatsappFlutuante />
      </body>
    </html>
  );
}
