import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  calcularMetrosFitaBorda,
  calcularPlanoCorte,
  calcularPreviaCusto,
  type Chapa as ChapaCalc,
  type ItemFerragem,
  type Peca as PecaCalc,
  type PreviaCusto,
  type ResultadoCalculo,
} from '@arquijo/calc';
import type { Prisma } from '@prisma/client';
import { num } from '../../common/numero';
import { PrismaService } from '../../prisma/prisma.service';

export interface CalculoProjeto {
  projetoId: string;
  resultado: ResultadoCalculo;
  metrosFitaBorda: number;
  previa: PreviaCusto;
  calculadoEm: Date;
  duracaoMs: number;
}

/**
 * Ponte entre o banco e o motor puro @arquijo/calc.
 * Usado por POST /projetos/:id/calcular e na criação de OS a partir de projeto.
 */
@Injectable()
export class CalculoProjetoService {
  constructor(private readonly prisma: PrismaService) {}

  async calcular(projetoId: string, opcoes: { espessuraSerraMm?: number } = {}): Promise<CalculoProjeto> {
    const projeto = await this.prisma.projeto.findFirst({
      where: { id: projetoId, deletadoEm: null },
      include: { pecas: { include: { chapa: true } } },
    });
    if (!projeto) throw new NotFoundException('Projeto não encontrado.');
    if (projeto.pecas.length === 0) throw new BadRequestException('O projeto não tem peças cadastradas.');

    const chapas = new Map<string, ChapaCalc>();
    const pecas: PecaCalc[] = projeto.pecas.map((p) => {
      chapas.set(p.chapa.id, {
        id: p.chapa.id,
        nome: p.chapa.nome,
        larguraMm: p.chapa.larguraMm,
        alturaMm: p.chapa.alturaMm,
        espessuraMm: p.chapa.espessuraMm,
        qtdEstoque: p.chapa.qtdEstoque,
        custoUnitario: num(p.chapa.custoUnitario),
        fornecedor: p.chapa.fornecedor ?? undefined,
      });
      return { id: p.id, nome: p.nome, larguraMm: p.larguraMm, alturaMm: p.alturaMm, quantidade: p.quantidade, chapaId: p.chapaId, veio: p.veio };
    });

    const inicio = performance.now();
    const resultado = calcularPlanoCorte(pecas, [...chapas.values()], {
      espessuraSerraMm: opcoes.espessuraSerraMm ?? projeto.espessuraSerraMm,
    });
    const metrosFitaBorda = calcularMetrosFitaBorda(pecas);
    const previa = calcularPreviaCusto({
      chapas: resultado.materiais.map((m) => ({ quantidade: m.chapasUsadas, custoUnitario: m.chapa.custoUnitario })),
      metrosFitaBorda,
      precoFitaPorMetro: num(projeto.precoFitaPorMetro),
      ferragens: (projeto.ferragens as unknown as ItemFerragem[]) ?? [],
      horasMaoDeObra: num(projeto.horasMaoDeObra),
      valorHora: num(projeto.valorHora),
      margemPct: num(projeto.margemPct),
    });
    const duracaoMs = Math.round((performance.now() - inicio) * 100) / 100;
    const calculadoEm = new Date();

    await this.prisma.projeto.update({
      where: { id: projetoId },
      data: {
        resultadoCalculo: resultado as unknown as Prisma.InputJsonValue,
        previaCusto: { ...previa, metrosFitaBorda } as unknown as Prisma.InputJsonValue,
        calculadoEm,
        status: projeto.status === 'RASCUNHO' ? 'CALCULADO' : projeto.status,
      },
    });

    return { projetoId, resultado, metrosFitaBorda, previa, calculadoEm, duracaoMs };
  }
}
