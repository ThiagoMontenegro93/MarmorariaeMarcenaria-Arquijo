import { describe, expect, it } from 'vitest';
import { pdfListaCompra, pdfOrcamentoProjeto, pdfOrdemServico, pdfPropostaB2B } from '../src/pdf/geradores';
import { extrairTexto } from './pdf-util';

const opcoes = { comprimir: false, agora: new Date('2026-10-24T12:00:00-03:00') };

function validarCabecalho(pdf: Buffer) {
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.subarray(-6).toString()).toContain('%%EOF');
  const texto = extrairTexto(pdf);
  expect(texto).toContain('Arquijo Marmoraria e Marcenaria');
  expect(texto).toContain('+55 21 98450-3570');
  expect(texto).toContain('R. Mupia');
  return texto;
}

const previa = { custoMdf: 590, custoFita: 70.6, custoFerragens: 162, custoMaoDeObra: 960, custoTotal: 1782.6, margemPct: 30, margemValor: 534.78, valorFinal: 2317.38 };

describe('pdfOrcamentoProjeto', () => {
  it('gera PDF com cliente, peças, chapas e valor final', async () => {
    const pdf = await pdfOrcamentoProjeto(
      {
        projeto: { nome: 'Cozinha Ana', ambiente: 'Cozinha' },
        cliente: { nome: 'Ana Lima', telefone: '5521900000000' },
        pecas: [{ nome: 'Lateral', larguraMm: 2100, alturaMm: 600, quantidade: 2, material: 'MDF Freijó 18mm', veio: true }],
        materiais: [{ nome: 'MDF Freijó 18mm', chapasUsadas: 1, aproveitamentoPct: 60.54 }],
        previa,
      },
      opcoes,
    );
    const t = validarCabecalho(pdf);
    expect(t).toContain('Orçamento');
    expect(t).toContain('Cozinha Ana');
    expect(t).toContain('Ana Lima');
    expect(t).toContain('2100 × 600');
    expect(t).toContain('R$ 2.317,38');
    expect(t).toContain('Entrada (50%)');
  });
});

describe('pdfOrdemServico', () => {
  it('gera PDF com código, etapa, prazo, histórico e pagamentos', async () => {
    const pdf = await pdfOrdemServico(
      {
        codigo: 'OS-101',
        cliente: { nome: 'Ana Lima', telefone: '5521900000000' },
        ambiente: 'Cozinha',
        status: 'PRODUCAO',
        prioridade: 'ALTA',
        prazoAcordado: new Date('2026-11-10T12:00:00-03:00'),
        prazoReal: null,
        atrasoDias: 0,
        valorTotal: 18500,
        valorRecebido: 9250,
        statusFinanceiro: 'PARCIAL',
        historico: [{ para: 'ORCAMENTO', entrouEm: new Date('2026-10-01T10:00:00-03:00') }],
        pagamentos: [{ tipo: 'ENTRADA', forma: 'PIX', valor: 9250, status: 'PAGO', vencimento: null, pagoEm: new Date('2026-10-02T10:00:00-03:00') }],
        materiais: [{ nome: 'MDF Freijó 18mm', quantidade: 1 }],
      },
      opcoes,
    );
    const t = validarCabecalho(pdf);
    expect(t).toContain('Ordem de Serviço OS-101');
    expect(t).toContain('Produção');
    expect(t).toContain('10/11/2026');
    expect(t).toContain('R$ 9.250,00');
    expect(t).toContain('Alta');
  });
});

describe('pdfPropostaB2B', () => {
  it('gera proposta com empresa, CNPJ formatado, simulação e condições', async () => {
    const pdf = await pdfPropostaB2B(
      {
        lead: { nomeEmpresa: 'Imob Barra', cnpj: '11222333000181', responsavel: 'Paula', tipo: 'IMOBILIARIA', unidades: 20, bairro: 'Barra da Tijuca', precisaMedicao: true },
        valorUnitario: 12400,
        simulacao: { unidades: 20, valorUnitario: 12400, descontoPct: 15, valorUnitarioComDesconto: 10540, valorBruto: 248000, valorTotal: 210800, economia: 37200, prazoDias: 25 },
      },
      opcoes,
    );
    const t = validarCabecalho(pdf);
    expect(t).toContain('Proposta Comercial');
    expect(t).toContain('Imob Barra');
    expect(t).toContain('11.222.333/0001-81');
    expect(t).toContain('15%');
    expect(t).toContain('R$ 210.800,00');
    expect(t).toContain('25 dias');
  });
});

describe('pdfListaCompra', () => {
  it('lista itens a comprar com total', async () => {
    const pdf = await pdfListaCompra(
      {
        projeto: { nome: 'Cozinha Ana' },
        itens: [
          { nome: 'MDF Freijó 18mm', quantidade: 2, custoUnitario: 280, custoTotal: 560 },
          { nome: 'MDF Branco TX 15mm', quantidade: 1, custoUnitario: 310, custoTotal: 310 },
        ],
        doEstoque: [{ nome: 'MDF Naval 18mm', quantidade: 1 }],
      },
      opcoes,
    );
    const t = validarCabecalho(pdf);
    expect(t).toContain('Lista de Compra');
    expect(t).toContain('MDF Freijó 18mm');
    expect(t).toContain('R$ 870,00');
    expect(t).toContain('Do estoque');
  });

  it('com lista vazia informa que tudo está em estoque', async () => {
    const t = extrairTexto(await pdfListaCompra({ projeto: { nome: 'X' }, itens: [], doEstoque: [] }, opcoes));
    expect(t).toContain('Nada a comprar');
  });
});
