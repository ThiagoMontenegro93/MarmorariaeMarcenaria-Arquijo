import { layoutPlano, type PecaPlano, type SobraPlano } from '@/lib/plano-svg';

/** Plano de corte de uma chapa em SVG: peças coloridas, fundo cinza = perda, tracejado verde = retalho reaproveitável. */
export function PlanoCorteSvg({
  chapa,
  pecas,
  sobras,
  titulo,
}: {
  chapa: { larguraMm: number; alturaMm: number; nome: string };
  pecas: PecaPlano[];
  sobras: SobraPlano[];
  titulo: string;
}) {
  const l = layoutPlano(chapa, pecas, sobras, 600);
  return (
    <svg
      viewBox={`0 0 ${l.largura} ${l.altura}`}
      className="h-auto w-full rounded border border-linha"
      role="img"
      aria-label={`${titulo}: ${pecas.length} peças em ${chapa.nome} ${chapa.larguraMm}×${chapa.alturaMm} mm`}
      data-testid="plano-corte"
    >
      <rect x={0} y={0} width={l.largura} height={l.altura} fill="#dcd6cc" />
      {l.sobras.map((s, i) => (
        <g key={`s${i}`}>
          <rect x={s.x + 1} y={s.y + 1} width={Math.max(0, s.w - 2)} height={Math.max(0, s.h - 2)} fill="none" stroke="#24734a" strokeWidth={1.5} strokeDasharray="4 3" />
          {s.w > 50 && s.h > 14 && (
            <text x={s.x + 4} y={s.y + 13} fontSize={10} fill="#56534d">
              {s.rotulo}
            </text>
          )}
        </g>
      ))}
      {l.pecas.map((p, i) => (
        <g key={`p${i}`}>
          <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={p.cor} stroke="rgba(0,0,0,.45)" strokeWidth={1} />
          <title>{`${p.rotulo} ${p.medidas} mm`}</title>
          {p.mostrarRotulo && (
            <>
              <text x={p.x + 3} y={p.y + 12} fontSize={Math.min(12, p.h / 2.5)} fontWeight={600} fill="#1b1a18">
                {p.rotulo}
              </text>
              {p.h > 28 && p.w > 40 && (
                <text x={p.x + 3} y={p.y + 25} fontSize={10} fill="#1b1a18">
                  {p.medidas}
                </text>
              )}
            </>
          )}
        </g>
      ))}
    </svg>
  );
}
