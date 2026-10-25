import { describe, expect, it } from 'vitest';
import { montarFunil, resumirFluxoCaixa } from '../src/dominio/dashboard';

describe('montarFunil (RF16)', () => {
  it('conta OS que alcançaram cada etapa e a conversão', () => {
    const os = [
      { status: 'ORCAMENTO' as const, valorTotal: 1000 },
      { status: 'ORCAMENTO' as const, valorTotal: 1000 },
      { status: 'APROVADO' as const, valorTotal: 2000 },
      { status: 'PRODUCAO' as const, valorTotal: 3000 },
      { status: 'FINALIZADO' as const, valorTotal: 4000 },
    ];
    const f = montarFunil(os);
    expect(f[0]).toMatchObject({ etapa: 'ORCAMENTO', quantidade: 5, valor: 11000, conversaoPct: 100 });
    expect(f[1]).toMatchObject({ etapa: 'APROVADO', quantidade: 3, valor: 9000, conversaoPct: 60 });
    expect(f[2]).toMatchObject({ etapa: 'PRODUCAO', quantidade: 2, valor: 7000 });
    expect(f.at(-1)).toMatchObject({ etapa: 'RECEBIMENTO', quantidade: 1, valor: 4000 });
  });
});

describe('resumirFluxoCaixa (RF18)', () => {
  const hoje = new Date('2026-10-24T12:00:00-03:00');
  const pagamentos = [
    { valor: 6000, status: 'PAGO' as const, forma: 'PIX' as const, pagoEm: new Date('2026-10-22T10:00:00-03:00'), vencimento: null },
    { valor: 4000, status: 'PAGO' as const, forma: 'CARTAO' as const, pagoEm: new Date('2026-10-01T10:00:00-03:00'), vencimento: null },
    { valor: 3000, status: 'PENDENTE' as const, forma: 'PIX' as const, pagoEm: null, vencimento: new Date('2026-10-30T10:00:00-03:00') },
    { valor: 2500, status: 'PENDENTE' as const, forma: 'PARCELADO' as const, pagoEm: null, vencimento: new Date('2026-10-10T10:00:00-03:00') },
    { valor: 999, status: 'CANCELADO' as const, forma: 'PIX' as const, pagoEm: null, vencimento: null },
  ];
  const r = resumirFluxoCaixa(pagamentos, hoje);

  it('recebido nos últimos 7 dias', () => expect(r.recebidoSemana).toBe(6000));
  it('a receber até o fim do mês (inclui atrasados)', () => expect(r.aReceberAteFimMes).toBe(5500));
  it('em atraso', () => expect(r.emAtraso).toBe(2500));
  it('distribuição por forma dos recebidos', () => {
    expect(r.porForma).toEqual({ PIX: 60, CARTAO: 40, PARCELADO: 0 });
  });
});
