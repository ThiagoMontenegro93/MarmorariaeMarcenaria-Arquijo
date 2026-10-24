import { EMPRESA } from '@/lib/empresa';

export function Rodape() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-stone-50 py-8 text-sm text-stone-600">
      <div className="container-site flex flex-col gap-2 md:flex-row md:justify-between">
        <div>
          <p className="font-semibold text-pedra">{EMPRESA.nome}</p>
          <p>{EMPRESA.endereco}</p>
          <p>
            {EMPRESA.telefone} · {EMPRESA.horario}
          </p>
        </div>
        <p className="md:text-right">
          Atendemos: {EMPRESA.areaAtendimento}.<br />
          Seus dados são tratados conforme a LGPD.
        </p>
      </div>
    </footer>
  );
}
