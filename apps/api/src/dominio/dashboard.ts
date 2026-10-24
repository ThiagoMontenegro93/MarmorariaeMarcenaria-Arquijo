import { diaCivil, ultimoDiaDoMes } from './datas';
import { indiceEtapa, type EtapaOS } from './os-fluxo';

/** Etapas exibidas no funil ponta a ponta (orçamento até recebimento — RF16). */
export const ETAPAS_FUNIL: EtapaOS[] = ['ORCAMENTO', 'APROVADO', 'PRODUCAO', 'INSTALACAO', 'ENTREGA', 'RECEBIMENTO'];

export interface EtapaFunil {
  etapa: EtapaOS;
  quantidade: number;
  valor: number;
  /** % em relação à etapa anterior do funil. */
  conversaoPct: number;
}

/** Uma OS "alcançou" a etapa se o status atual está nela ou depois dela. */
export function montarFunil(ordens: { status: EtapaOS; valorTotal: number }[]): EtapaFunil[] {
  const resultado: EtapaFunil[] = [];
  for (const etapa of ETAPAS_FUNIL) {
    const alvo = indiceEtapa(etapa);
    const alcancaram = ordens.filter((o) => indiceEtapa(o.status) >= alvo);
    const quantidade = alcancaram.length;
    const anterior = resultado.at(-1);
    const base = anterior ? anterior.quantidade : quantidade;
    resultado.push({
      etapa,
      quantidade,
      valor: Math.round(alcancaram.reduce((s, o) => s + o.valorTotal, 0) * 100) / 100,
      conversaoPct: base > 0 ? Math.round((quantidade / base) * 10000) / 100 : 0,
    });
  }
  return resultado;
}

export interface PagamentoFluxo {
  valor: number;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  forma: 'PIX' | 'CARTAO' | 'PARCELADO';
  pagoEm: Date | null;
  vencimento: Date | null;
}

export interface ResumoFluxoCaixa {
  recebidoSemana: number;
  aReceberAteFimMes: number;
  aReceberTotal: number;
  emAtraso: number;
  /** % do valor recebido por forma de pagamento. */
  porForma: Record<'PIX' | 'CARTAO' | 'PARCELADO', number>;
}

const arred2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

/** Fluxo de caixa (RF18): recebido na semana, a receber até o dia 30/31, em atraso. */
export function resumirFluxoCaixa(pagamentos: PagamentoFluxo[], hoje: Date): ResumoFluxoCaixa {
  const hojeDia = diaCivil(hoje);
  const seteDiasAtras = new Date(hoje.getTime() - 7 * 86_400_000);
  const fimMes = ultimoDiaDoMes(hoje);

  let recebidoSemana = 0;
  let aReceberAteFimMes = 0;
  let aReceberTotal = 0;
  let emAtraso = 0;
  const pagosPorForma = { PIX: 0, CARTAO: 0, PARCELADO: 0 };

  for (const p of pagamentos) {
    if (p.status === 'PAGO') {
      pagosPorForma[p.forma] += p.valor;
      if (p.pagoEm && p.pagoEm >= seteDiasAtras && p.pagoEm <= hoje) recebidoSemana += p.valor;
    } else if (p.status === 'PENDENTE') {
      aReceberTotal += p.valor;
      if (p.vencimento) {
        const venc = diaCivil(p.vencimento);
        if (venc <= fimMes) aReceberAteFimMes += p.valor;
        if (venc < hojeDia) emAtraso += p.valor;
      }
    }
  }

  const totalPago = pagosPorForma.PIX + pagosPorForma.CARTAO + pagosPorForma.PARCELADO;
  const pct = (v: number) => (totalPago > 0 ? arred2((v / totalPago) * 100) : 0);
  return {
    recebidoSemana: arred2(recebidoSemana),
    aReceberAteFimMes: arred2(aReceberAteFimMes),
    aReceberTotal: arred2(aReceberTotal),
    emAtraso: arred2(emAtraso),
    porForma: { PIX: pct(pagosPorForma.PIX), CARTAO: pct(pagosPorForma.CARTAO), PARCELADO: pct(pagosPorForma.PARCELADO) },
  };
}
