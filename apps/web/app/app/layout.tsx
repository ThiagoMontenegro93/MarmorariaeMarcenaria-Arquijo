import Link from 'next/link';

const MENU = [
  { href: '/app', rotulo: 'Dashboard' },
  { href: '/app/os', rotulo: 'Ordens de serviço' },
  { href: '/app/chapas', rotulo: 'Chapas e cálculo' },
];

/**
 * Área interna. Esqueleto da Fase 1: navegação e páginas placeholder.
 * A autenticação (login → JWT da API em cookie httpOnly via route handler) é o próximo passo.
 */
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-site grid gap-6 py-8 md:grid-cols-[200px_1fr]">
      <aside className="rounded-xl bg-stone-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase text-stone-500">Sistema interno</p>
        <nav aria-label="Sistema" className="flex flex-col gap-2 text-sm">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} className="rounded px-2 py-1 hover:bg-marca-clara">
              {m.rotulo}
            </Link>
          ))}
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
