import { BotaoWhatsappFlutuante } from '@/components/BotaoWhatsapp';
import { Cabecalho } from '@/components/Cabecalho';
import { Rodape } from '@/components/Rodape';

/** Layout do site público: cabeçalho, rodapé e botão flutuante do WhatsApp em todas as páginas. */
export default function LayoutSite({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecalho />
      <main>{children}</main>
      <Rodape />
      <BotaoWhatsappFlutuante />
    </>
  );
}
