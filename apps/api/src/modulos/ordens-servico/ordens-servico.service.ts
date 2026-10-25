import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type StatusOS } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { num } from '../../common/numero';
import {
  COR_ETAPA,
  ETAPAS_OS,
  ETAPAS_POS_ENTREGA,
  ROTULO_ETAPA,
  calcularAtrasoDias,
  calcularStatusFinanceiro,
  proximaEtapa,
  valorEntradaPadrao,
} from '../../dominio/os-fluxo';
import { PrismaService } from '../../prisma/prisma.service';
import { CalculoProjetoService } from '../projetos/calculo-projeto.service';
import type { AtualizarOrdemServicoDto, CriarOrdemServicoDto, FiltroOrdensDto } from './ordens-servico.dto';

const INCLUIR_RESUMO = {
  cliente: { select: { id: true, nome: true, telefone: true } },
  responsavel: { select: { id: true, nome: true } },
} satisfies Prisma.OrdemServicoInclude;

type OsComDatas = { numero: number; prazoAcordado: Date | null; prazoReal: Date | null; status: StatusOS };

/** Acrescenta campos derivados: código OS-101, atraso e cor da etapa. */
function enriquecer<T extends OsComDatas>(os: T, hoje = new Date()) {
  const atrasoDias = calcularAtrasoDias(os.prazoAcordado, os.prazoReal, hoje);
  return { ...os, codigo: `OS-${os.numero}`, atrasoDias, atrasada: atrasoDias > 0, corEtapa: COR_ETAPA[os.status], rotuloEtapa: ROTULO_ETAPA[os.status] };
}

@Injectable()
export class OrdensServicoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly calculo: CalculoProjetoService,
  ) {}

  async listar(f: FiltroOrdensDto) {
    const hoje = new Date();
    const where: Prisma.OrdemServicoWhereInput = {
      deletadoEm: null,
      status: f.status,
      prioridade: f.prioridade,
      responsavelId: f.responsavelId,
      ...(f.atrasadas ? { prazoAcordado: { lt: hoje }, status: { notIn: [...ETAPAS_POS_ENTREGA] } } : {}),
    };
    const ordens = await this.prisma.ordemServico.findMany({
      where,
      include: INCLUIR_RESUMO,
      orderBy: [{ prazoAcordado: { sort: 'asc', nulls: 'last' } }, { numero: 'asc' }],
      take: 500,
    });
    return ordens.map((o) => enriquecer(o, hoje));
  }

  /** RF11 — Kanban com as 9 colunas, na ordem do fluxo. */
  async kanban() {
    const ordens = await this.listar({});
    return ETAPAS_OS.map((etapa) => ({
      etapa,
      rotulo: ROTULO_ETAPA[etapa],
      cor: COR_ETAPA[etapa],
      ordens: ordens.filter((o) => o.status === etapa),
    }));
  }

  /** RF17 — barras do Gantt: início (aprovação ou orçamento) até o prazo; vermelho se atrasada. */
  async gantt() {
    const ordens = await this.listar({});
    return ordens
      .filter((o) => o.prazoAcordado && o.status !== 'FINALIZADO')
      .map((o) => ({
        id: o.id,
        codigo: o.codigo,
        cliente: o.cliente.nome,
        ambiente: o.ambiente,
        prioridade: o.prioridade,
        status: o.status,
        inicio: o.dataAprovacao ?? o.dataOrcamento,
        fim: o.prazoAcordado,
        atrasada: o.atrasada,
        atrasoDias: o.atrasoDias,
      }));
  }

  async obter(id: string) {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id, deletadoEm: null },
      include: {
        ...INCLUIR_RESUMO,
        projeto: { select: { id: true, nome: true, calculadoEm: true } },
        historico: { orderBy: { entrouEm: 'asc' }, include: { usuario: { select: { nome: true } } } },
        pagamentos: { orderBy: { criadoEm: 'asc' } },
        mensagens: { orderBy: { criadoEm: 'desc' }, take: 50 },
      },
    });
    if (!os) throw new NotFoundException('Ordem de serviço não encontrada.');
    const agora = new Date();
    // RF14 — timeline com o tempo gasto em cada etapa.
    const timeline = os.historico.map((h) => ({
      etapa: h.para,
      rotulo: ROTULO_ETAPA[h.para],
      entrouEm: h.entrouEm,
      saiuEm: h.saiuEm,
      duracaoHoras: Math.round((((h.saiuEm ?? agora).getTime() - h.entrouEm.getTime()) / 3_600_000) * 10) / 10,
      usuario: h.usuario?.nome ?? null,
      observacao: h.observacao,
    }));
    return { ...enriquecer(os, agora), timeline, saldo: Math.max(0, num(os.valorTotal) - num(os.valorRecebido)) };
  }

  /** Cria a OS; se vier de um projeto, já calcula as chapas e vincula os materiais. */
  async criar(dto: CriarOrdemServicoDto, usuarioId: string) {
    const cliente = await this.prisma.cliente.findFirst({ where: { id: dto.clienteId, deletadoEm: null } });
    if (!cliente) throw new BadRequestException('Cliente não encontrado.');

    let materiais: Prisma.InputJsonValue | undefined;
    let valorTotal = dto.valorTotal;
    if (dto.projetoId) {
      const calc = await this.calculo.calcular(dto.projetoId);
      materiais = {
        calculadoEm: calc.calculadoEm.toISOString(),
        totalChapas: calc.resultado.totalChapas,
        aproveitamentoGeralPct: calc.resultado.aproveitamentoGeralPct,
        listaCompra: calc.resultado.listaCompra,
        porMaterial: calc.resultado.materiais.map((m) => ({
          chapaId: m.chapa.id,
          nome: m.chapa.nome,
          chapasUsadas: m.chapasUsadas,
          qtdDoEstoque: m.qtdDoEstoque,
          qtdCompra: m.qtdCompra,
          aproveitamentoPct: m.aproveitamentoPct,
        })),
        previaCusto: calc.previa,
      } as unknown as Prisma.InputJsonValue;
      valorTotal ??= calc.previa.valorFinal;
    }
    valorTotal ??= 0;

    const os = await this.prisma.ordemServico.create({
      data: {
        clienteId: dto.clienteId,
        projetoId: dto.projetoId,
        responsavelId: dto.responsavelId,
        ambiente: dto.ambiente,
        descricao: dto.descricao,
        prioridade: dto.prioridade,
        prazoAcordado: dto.prazoAcordado ? new Date(dto.prazoAcordado) : undefined,
        valorTotal,
        valorEntrada: valorEntradaPadrao(valorTotal),
        materiais,
        historico: { create: { de: null, para: 'ORCAMENTO', usuarioId } },
      },
      include: INCLUIR_RESUMO,
    });
    await this.audit.registrar({ usuarioId, acao: 'OS_CRIAR', entidade: 'OrdemServico', entidadeId: os.id, dados: { numero: os.numero, valorTotal, projetoId: dto.projetoId ?? null } });
    return enriquecer(os);
  }

  async atualizar(id: string, dto: AtualizarOrdemServicoDto, usuarioId: string) {
    const atual = await this.prisma.ordemServico.findFirst({ where: { id, deletadoEm: null } });
    if (!atual) throw new NotFoundException('Ordem de serviço não encontrada.');
    const data: Prisma.OrdemServicoUncheckedUpdateInput = {
      responsavelId: dto.responsavelId,
      ambiente: dto.ambiente,
      descricao: dto.descricao,
      prioridade: dto.prioridade,
      prazoAcordado: dto.prazoAcordado ? new Date(dto.prazoAcordado) : undefined,
      dataMedicao: dto.dataMedicao ? new Date(dto.dataMedicao) : undefined,
    };
    if (dto.valorTotal !== undefined) {
      data.valorTotal = dto.valorTotal;
      data.valorEntrada = valorEntradaPadrao(dto.valorTotal);
      data.statusFinanceiro = calcularStatusFinanceiro(dto.valorTotal, num(atual.valorRecebido));
    }
    const os = await this.prisma.ordemServico.update({ where: { id }, data, include: INCLUIR_RESUMO });
    if (dto.prazoAcordado || dto.valorTotal !== undefined || dto.prioridade) {
      await this.audit.registrar({ usuarioId, acao: 'OS_ATUALIZAR', entidade: 'OrdemServico', entidadeId: id, dados: { ...dto } });
    }
    return enriquecer(os);
  }

  /**
   * Move a OS para a próxima etapa (RF11/RF13/RF14):
   * fecha a etapa atual no histórico, abre a nova e registra datas-chave.
   * Usa update condicional ao status atual para evitar avanço duplo concorrente.
   */
  async avancar(id: string, usuarioId: string, observacao?: string) {
    const os = await this.prisma.ordemServico.findFirst({ where: { id, deletadoEm: null } });
    if (!os) throw new NotFoundException('Ordem de serviço não encontrada.');
    const proxima = proximaEtapa(os.status);
    if (!proxima) throw new BadRequestException('A OS já está finalizada.');

    const agora = new Date();
    const extras: Prisma.OrdemServicoUpdateManyMutationInput = {};
    if (proxima === 'APROVADO') extras.dataAprovacao = agora;
    if (proxima === 'ENTREGA') extras.prazoReal = agora;

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.ordemServico.updateMany({ where: { id, status: os.status }, data: { status: proxima, ...extras } });
      if (count === 0) throw new ConflictException('A OS foi alterada por outra pessoa. Recarregue e tente novamente.');
      await tx.historicoEtapa.updateMany({ where: { ordemServicoId: id, saiuEm: null }, data: { saiuEm: agora } });
      await tx.historicoEtapa.create({ data: { ordemServicoId: id, de: os.status, para: proxima, entrouEm: agora, usuarioId, observacao } });
    });

    await this.audit.registrar({ usuarioId, acao: 'OS_AVANCAR_ETAPA', entidade: 'OrdemServico', entidadeId: id, dados: { de: os.status, para: proxima } });
    return this.obter(id);
  }

  async remover(id: string, usuarioId: string) {
    const os = await this.prisma.ordemServico.findFirst({ where: { id, deletadoEm: null } });
    if (!os) throw new NotFoundException('Ordem de serviço não encontrada.');
    await this.prisma.ordemServico.update({ where: { id }, data: { deletadoEm: new Date() } });
    await this.audit.registrar({ usuarioId, acao: 'OS_REMOVER', entidade: 'OrdemServico', entidadeId: id, dados: { numero: os.numero } });
    return { ok: true };
  }
}
