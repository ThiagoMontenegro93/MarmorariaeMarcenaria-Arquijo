import Link from 'next/link';
import { EMPRESA, linkWhatsApp } from '@/lib/empresa';

const LINKS = [
  { href: '/colecoes', rotulo: 'Coleções' },
  { href: '/empresas', rotulo: 'Para empresas' },
  { href: '/contato', rotulo: 'Contato' },
];

export function Cabecalho() {
  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="container-site flex flex-wrap items-center justify-between gap-3 py-4">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-lg font-bold text-marca-escura">Arquijo</span>
          <span className="text-xs text-stone-500">Marmoraria e Marcenaria</span>
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-5 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-marca">
              {l.rotulo}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-xs">
          <a href={EMPRESA.linkGoogle} target="_blank" rel="noopener noreferrer" className="rounded-full bg-marca-clara px-3 py-1 text-marca-escura">
            ✔ Empresa verificada no Google
          </a>
          <a href={linkWhatsApp()} target="_blank" rel="noopener noreferrer" className="text-green-700">
            ● Online — responde em até 5 min
          </a>
        </div>
      </div>
    </header>
  );
}
