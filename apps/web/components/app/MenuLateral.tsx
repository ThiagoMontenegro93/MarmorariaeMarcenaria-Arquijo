'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MenuLateral({ itens }: { itens: { href: string; rotulo: string }[] }) {
  const atual = usePathname();
  return (
    <nav aria-label="Sistema" className="flex gap-1 overflow-x-auto md:flex-col">
      {itens.map((m) => {
        const ativo = m.href === '/app' ? atual === '/app' : atual === m.href || atual.startsWith(`${m.href}/`);
        return (
          <Link
            key={m.href}
            href={m.href}
            aria-current={ativo ? 'page' : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${ativo ? 'bg-marca text-white' : 'text-stone-200 hover:bg-white/10'}`}
          >
            {m.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
