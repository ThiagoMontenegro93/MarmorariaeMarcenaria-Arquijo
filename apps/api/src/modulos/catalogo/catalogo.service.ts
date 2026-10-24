import { Injectable, NotFoundException } from '@nestjs/common';
import { num } from '../../common/numero';
import { EMPRESA } from '../../dominio/empresa';
import { sugerirColecoes } from '../../dominio/quiz';
import { gerarLinkWhatsApp } from '../../dominio/whatsapp-link';
import { PrismaService } from '../../prisma/prisma.service';
import type { FiltroModelosDto, FiltroObrasDto, QuizDto } from './catalogo.dto';

/** Leitura pública do catálogo (Módulos A e E). Nunca expõe dados internos. */
@Injectable()
export class CatalogoService {
  constructor(private readonly prisma: PrismaService) {}

  empresa() {
    return EMPRESA;
  }

  colecoes() {
    return this.prisma.colecao.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } });
  }

  async colecao(slug: string) {
    const c = await this.prisma.colecao.findFirst({
      where: { slug, ativo: true },
      include: { modelos: { where: { ativo: true }, orderBy: { ordem: 'asc' } } },
    });
    if (!c) throw new NotFoundException('Coleção não encontrada.');
    return { ...c, modelos: c.modelos.map((m) => this.comBotoes(m)) };
  }

  /** Acrescenta o botão "Quero este modelo" com mensagem pré-preenchida. */
  private comBotoes<T extends { nome: string; slug: string }>(m: T) {
    return { ...m, linkWhatsapp: gerarLinkWhatsApp(EMPRESA.whatsapp, `Olá! Quero o modelo "${m.nome}". Pode me passar mais detalhes?`) };
  }

  async modelos(f: FiltroModelosDto) {
    const modelos = await this.prisma.modelo.findMany({
      where: {
        ativo: true,
        ...(f.ambiente ? { ambiente: { equals: f.ambiente, mode: 'insensitive' } } : {}),
        ...(f.colecao ? { colecao: { slug: f.colecao } } : {}),
      },
      include: { colecao: { select: { slug: true, nome: true } } },
      orderBy: { ordem: 'asc' },
    });
    return modelos.map((m) => this.comBotoes(m));
  }

  async modelo(slug: string) {
    const m = await this.prisma.modelo.findFirst({ where: { slug, ativo: true }, include: { colecao: true } });
    if (!m) throw new NotFoundException('Modelo não encontrado.');
    return this.comBotoes(m);
  }

  combos() {
    return this.prisma.combo.findMany({
      where: { ativo: true },
      include: { itens: { include: { modelo: { select: { slug: true, nome: true, preco: true } } } } },
      orderBy: { nome: 'asc' },
    });
  }

  obras(f: FiltroObrasDto) {
    return this.prisma.obraPortfolio.findMany({
      where: {
        publicado: true,
        deletadoEm: null,
        tipoCliente: f.tipoCliente,
        ...(f.material ? { materiais: { hasSome: [f.material] } } : {}),
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async obra(slug: string) {
    const o = await this.prisma.obraPortfolio.findFirst({ where: { slug, publicado: true, deletadoEm: null } });
    if (!o) throw new NotFoundException('Obra não encontrada.');
    return o;
  }

  /** RF09 — quiz: devolve coleções ordenadas por aderência. */
  async quiz(dto: QuizDto) {
    const colecoes = await this.colecoes();
    const sugestoes = sugerirColecoes(
      colecoes.map((c) => ({ ...c, precoAPartirDe: num(c.precoAPartirDe) })),
      dto,
    );
    return { respostas: dto, sugestoes };
  }
}
