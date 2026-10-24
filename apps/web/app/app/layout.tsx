import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BotaoSair } from '@/components/app/BotaoSair';
import { MenuLateral } from '@/components/app/MenuLateral';
import { EMPRESA, linkWhatsApp } from '@/lib/empresa';
import { menuPara } from '@/lib/permissoes';
import { obterSessao } from '@/lib/servidor';

export const dynamic = 'force-dynamic';

const ROTULO_PERFIL = { ADMIN: 'Administrador', GESTOR: 'Gestor', MARCENEIRO: 'Marceneiro', COMERCIAL: 'Comercial' } as const;

/** Casca da área interna: menu filtrado pelo perfil (espelha os guards da API). */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const s = await obterSessao();
  if (!s) redirect('/login');
  const { sessao } = s;
  return (
    <div className="min-h-screen bg-fundo md:grid md:grid-cols-[230px_1fr]">
      <aside className="flex flex-col gap-4 bg-grafite p-4 text-white md:min-h-screen">
        <Link href="/" className="leading-tight">
          <span className="font-display text-xl font-semibold text-marca-clara">Arquijo</span>
          <span className="block text-[11px] text-stone-400">Marmoraria e Marcenaria</span>
        </Link>
        <MenuLateral itens={menuPara(sessao.perfil)} />
        <div className="mt-auto hidden space-y-2 border-t border-white/10 pt-3 text-xs text-stone-300 md:block">
          <a href={EMPRESA.linkGoogle} target="_blank" rel="noopener noreferrer" className="block hover:text-white">
            ✔ Empresa verificada no Google
          </a>
          <a href={linkWhatsApp()} target="_blank" rel="noopener noreferrer" className="block text-green-300 hover:text-green-200">
            ● WhatsApp {EMPRESA.telefone}
          </a>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm">
          <span>
            <span className="block font-semibold" data-testid="usuario-nome">
              {sessao.nome}
            </span>
            <span className="text-xs text-stone-400">{ROTULO_PERFIL[sessao.perfil]}</span>
          </span>
          <BotaoSair />
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
