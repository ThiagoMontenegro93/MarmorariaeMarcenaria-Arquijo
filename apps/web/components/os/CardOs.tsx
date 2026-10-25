import Link from 'next/link';
import { brl, data, ESTILO_PRIORIDADE, ROTULO_PRIORIDADE } from '@/lib/formato';
import type { OsResumo } from './tipos';

export function CardOs({ os, onAvancar, ocupado }: { os: OsResumo; onAvancar?: () => void; ocupado?: boolean }) {
  return (
    <article className="rounded-lg border border-linha bg-white p-3 text-sm shadow-sm" data-testid={`card-${os.codigo}`}>
      <div className="flex items-center justify-between gap-2">
        <Link href={`/app/os/${os.id}`} className="font-semibold text-marca-escura hover:underline">
          {os.codigo}
        </Link>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ESTILO_PRIORIDADE[os.prioridade]}`}>{ROTULO_PRIORIDADE[os.prioridade]}</span>
      </div>
      <p className="mt-1 truncate">{os.cliente.nome}</p>
      <p className="text-xs text-stone-500">{os.ambiente}</p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="tabular-nums">{brl(os.valorTotal)}</span>
        {os.atrasoDias > 0 ? (
          <span className="font-semibold text-red-700">{os.atrasoDias}d atraso</span>
        ) : (
          <span className="text-stone-500">prazo {data(os.prazoAcordado)}</span>
        )}
      </div>
      {onAvancar && os.status !== 'FINALIZADO' && (
        <button type="button" onClick={onAvancar} disabled={ocupado} className="mt-2 w-full rounded border border-linha py-1 text-xs hover:border-marca disabled:opacity-50">
          Mover para a próxima etapa →
        </button>
      )}
    </article>
  );
}
