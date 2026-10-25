import { describe, expect, it } from 'vitest';
import {
  ETAPAS_OS,
  calcularAtrasoDias,
  calcularStatusFinanceiro,
  proximaEtapa,
  valorEntradaPadrao,
} from '../src/dominio/os-fluxo';

describe('fluxo de etapas da OS', () => {
  it('tem as 9 etapas na ordem do Kanban', () => {
    expect(ETAPAS_OS).toEqual([
      'ORCAMENTO', 'APROVADO', 'MEDICAO', 'COMPRA_MATERIAIS', 'PRODUCAO',
      'INSTALACAO', 'ENTREGA', 'RECEBIMENTO', 'FINALIZADO',
    ]);
  });

  it('avança para a etapa seguinte', () => {
    expect(proximaEtapa('ORCAMENTO')).toBe('APROVADO');
    expect(proximaEtapa('RECEBIMENTO')).toBe('FINALIZADO');
  });

  it('não avança depois de FINALIZADO', () => {
    expect(proximaEtapa('FINALIZADO')).toBeNull();
  });
});

describe('calcularAtrasoDias (RF13)', () => {
  const prazo = new Date('2026-10-10T12:00:00-03:00');

  it('sem prazo acordado não há atraso', () => {
    expect(calcularAtrasoDias(null, null, new Date('2026-12-01'))).toBe(0);
  });

  it('entregue antes do prazo = 0', () => {
    expect(calcularAtrasoDias(prazo, new Date('2026-10-08T10:00:00-03:00'), new Date())).toBe(0);
  });

  it('entregue 3 dias depois do prazo = 3', () => {
    expect(calcularAtrasoDias(prazo, new Date('2026-10-13T09:00:00-03:00'), new Date())).toBe(3);
  });

  it('não entregue: compara com hoje', () => {
    expect(calcularAtrasoDias(prazo, null, new Date('2026-10-15T08:00:00-03:00'))).toBe(5);
    expect(calcularAtrasoDias(prazo, null, new Date('2026-10-10T19:00:00-03:00'))).toBe(0);
  });
});

describe('financeiro da OS (RF15)', () => {
  it('entrada padrão é 50% do total', () => {
    expect(valorEntradaPadrao(18500)).toBe(9250);
    expect(valorEntradaPadrao(1000.01)).toBe(500.01);
  });

  it('status financeiro: pendente, parcial e pago', () => {
    expect(calcularStatusFinanceiro(1000, 0)).toBe('PENDENTE');
    expect(calcularStatusFinanceiro(1000, 500)).toBe('PARCIAL');
    expect(calcularStatusFinanceiro(1000, 1000)).toBe('PAGO');
    expect(calcularStatusFinanceiro(0, 0)).toBe('PENDENTE');
  });
});
