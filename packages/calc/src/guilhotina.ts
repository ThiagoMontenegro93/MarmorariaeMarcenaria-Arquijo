import { ErroValidacaoCalculo, MaterialNaoEncontradoError, PecaMaiorQueChapaError } from './erros';
import { arredondar2 } from './numeros';
import type {
  Chapa,
  ItemCompra,
  OpcoesCalculo,
  Peca,
  PecaPosicionada,
  PlanoChapa,
  Retangulo,
  ResultadoCalculo,
  ResultadoMaterial,
} from './tipos';

export const ESPESSURA_SERRA_PADRAO_MM = 4;
export const SOBRA_MINIMA_PADRAO_MM = 300;

/** Uma unidade de peça (a cut list é expandida pela quantidade). */
interface Unidade {
  peca: Peca;
}

interface Orientacao {
  largura: number;
  altura: number;
  rotacionada: boolean;
}

/** Chapa em processo de corte: retângulos livres + peças já posicionadas. */
interface FolhaEmCorte {
  livres: Retangulo[];
  pecas: PecaPosicionada[];
}

interface Encaixe {
  indiceLivre: number;
  orientacao: Orientacao;
  pontuacao: number;
}

function validarNumeroPositivo(valor: number, rotulo: string): void {
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new ErroValidacaoCalculo(`${rotulo} inválida: ${valor}. Use um valor maior que zero.`);
  }
}

function validarPeca(p: Peca): void {
  validarNumeroPositivo(p.larguraMm, `Medida (largura) da peça "${p.nome}"`);
  validarNumeroPositivo(p.alturaMm, `Medida (altura) da peça "${p.nome}"`);
  if (!Number.isInteger(p.quantidade) || p.quantidade < 1) {
    throw new ErroValidacaoCalculo(`Quantidade inválida na peça "${p.nome}": ${p.quantidade}. Use um inteiro >= 1.`);
  }
}

function validarChapa(c: Chapa): void {
  validarNumeroPositivo(c.larguraMm, `Medida (largura) da chapa "${c.nome}"`);
  validarNumeroPositivo(c.alturaMm, `Medida (altura) da chapa "${c.nome}"`);
  if (!Number.isFinite(c.custoUnitario) || c.custoUnitario < 0) {
    throw new ErroValidacaoCalculo(`Custo da chapa "${c.nome}" não pode ser negativo.`);
  }
}

function orientacoesPermitidas(p: Peca): Orientacao[] {
  const normal: Orientacao = { largura: p.larguraMm, altura: p.alturaMm, rotacionada: false };
  // Veio = sem rotação. Peça quadrada não precisa testar a rotação.
  if (p.veio || p.larguraMm === p.alturaMm) return [normal];
  return [normal, { largura: p.alturaMm, altura: p.larguraMm, rotacionada: true }];
}

/** Melhor encaixe numa folha: "best short side fit" entre os retângulos livres. */
function melhorEncaixe(folha: FolhaEmCorte, orientacoes: Orientacao[]): Encaixe | null {
  let melhor: Encaixe | null = null;
  folha.livres.forEach((livre, indiceLivre) => {
    for (const o of orientacoes) {
      if (o.largura <= livre.largura && o.altura <= livre.altura) {
        const pontuacao = Math.min(livre.largura - o.largura, livre.altura - o.altura);
        if (!melhor || pontuacao < melhor.pontuacao) {
          melhor = { indiceLivre, orientacao: o, pontuacao };
        }
      }
    }
  });
  return melhor;
}

/**
 * Posiciona a peça no canto superior esquerdo do retângulo livre e faz o corte
 * guilhotina: escolhe entre corte horizontal ou vertical o que deixa o maior
 * retalho contínuo. A serra consome `serra` mm em cada corte.
 */
function posicionar(folha: FolhaEmCorte, encaixe: Encaixe, peca: Peca, serra: number): void {
  const livre = folha.livres[encaixe.indiceLivre]!;
  const { largura: w, altura: h, rotacionada } = encaixe.orientacao;

  folha.pecas.push({
    ...(peca.id !== undefined ? { id: peca.id } : {}),
    nome: peca.nome,
    x: livre.x,
    y: livre.y,
    largura: w,
    altura: h,
    rotacionada,
    veio: peca.veio,
  });

  const sobraDireita = livre.largura - w - serra;
  const sobraAbaixo = livre.altura - h - serra;

  // Opção H: primeiro corte horizontal (faixa de baixo ocupa toda a largura).
  const opcaoH: Retangulo[] = [
    { x: livre.x, y: livre.y + h + serra, largura: livre.largura, altura: sobraAbaixo },
    { x: livre.x + w + serra, y: livre.y, largura: sobraDireita, altura: h },
  ];
  // Opção V: primeiro corte vertical (faixa da direita ocupa toda a altura).
  const opcaoV: Retangulo[] = [
    { x: livre.x + w + serra, y: livre.y, largura: sobraDireita, altura: livre.altura },
    { x: livre.x, y: livre.y + h + serra, largura: w, altura: sobraAbaixo },
  ];

  const maiorArea = (rs: Retangulo[]) =>
    Math.max(...rs.map((r) => (r.largura > 0 && r.altura > 0 ? r.largura * r.altura : 0)));
  const escolhida = maiorArea(opcaoH) >= maiorArea(opcaoV) ? opcaoH : opcaoV;

  folha.livres.splice(encaixe.indiceLivre, 1);
  for (const r of escolhida) {
    if (r.largura > 0 && r.altura > 0) folha.livres.push(r);
  }
}

function novaFolha(chapa: Chapa): FolhaEmCorte {
  return { livres: [{ x: 0, y: 0, largura: chapa.larguraMm, altura: chapa.alturaMm }], pecas: [] };
}

/** Empacota as unidades de um único material em quantas chapas forem necessárias. */
function empacotarMaterial(chapa: Chapa, unidades: Unidade[], serra: number): FolhaEmCorte[] {
  // Ordena pela maior área e depois pelo maior lado (heurística "decreasing").
  const ordenadas = [...unidades].sort((a, b) => {
    const areaA = a.peca.larguraMm * a.peca.alturaMm;
    const areaB = b.peca.larguraMm * b.peca.alturaMm;
    if (areaB !== areaA) return areaB - areaA;
    return Math.max(b.peca.larguraMm, b.peca.alturaMm) - Math.max(a.peca.larguraMm, a.peca.alturaMm);
  });

  const folhas: FolhaEmCorte[] = [];
  for (const { peca } of ordenadas) {
    const orientacoes = orientacoesPermitidas(peca);
    let colocada = false;
    // First fit entre chapas já abertas; best fit dentro da chapa.
    for (const folha of folhas) {
      const encaixe = melhorEncaixe(folha, orientacoes);
      if (encaixe) {
        posicionar(folha, encaixe, peca, serra);
        colocada = true;
        break;
      }
    }
    if (!colocada) {
      const folha = novaFolha(chapa);
      const encaixe = melhorEncaixe(folha, orientacoes);
      if (!encaixe) throw new PecaMaiorQueChapaError(peca, chapa);
      posicionar(folha, encaixe, peca, serra);
      folhas.push(folha);
    }
  }
  return folhas;
}

/**
 * Calcula as chapas necessárias com plano de corte guilhotina 2D — RF03, RF04, RF06.
 *
 * - Agrupa as peças por material (chapaId).
 * - Desconta a espessura da serra a cada corte (padrão 4mm).
 * - Peças com veio não são rotacionadas.
 * - Retorna aproveitamento/desperdício, sobras reaproveitáveis e estoque vs compra.
 *
 * Função pura: não acessa banco, rede ou relógio.
 */
export function calcularPlanoCorte(pecas: Peca[], chapas: Chapa[], opcoes: OpcoesCalculo = {}): ResultadoCalculo {
  const serra = opcoes.espessuraSerraMm ?? ESPESSURA_SERRA_PADRAO_MM;
  const sobraMinima = opcoes.sobraMinimaMm ?? SOBRA_MINIMA_PADRAO_MM;
  if (!Number.isFinite(serra) || serra < 0) {
    throw new ErroValidacaoCalculo('Espessura da serra não pode ser negativa.');
  }

  const chapasPorId = new Map(chapas.map((c) => [c.id, c]));
  // Map preserva a ordem de primeira aparição do material na cut list.
  const grupos = new Map<string, Unidade[]>();
  for (const peca of pecas) {
    validarPeca(peca);
    const chapa = chapasPorId.get(peca.chapaId);
    if (!chapa) throw new MaterialNaoEncontradoError(peca.chapaId, peca.nome);
    validarChapa(chapa);
    const grupo = grupos.get(chapa.id) ?? [];
    for (let i = 0; i < peca.quantidade; i++) grupo.push({ peca });
    grupos.set(chapa.id, grupo);
  }

  const materiais: ResultadoMaterial[] = [];
  for (const [chapaId, unidades] of grupos) {
    const chapa = chapasPorId.get(chapaId)!;
    const folhas = empacotarMaterial(chapa, unidades, serra);
    const areaChapa = chapa.larguraMm * chapa.alturaMm;

    const planos: PlanoChapa[] = folhas.map((f, indice) => {
      const areaPecas = f.pecas.reduce((s, p) => s + p.largura * p.altura, 0);
      return {
        indice,
        pecas: f.pecas,
        sobras: f.livres
          .filter((r) => Math.min(r.largura, r.altura) >= sobraMinima)
          .sort((a, b) => b.largura * b.altura - a.largura * a.altura),
        aproveitamentoPct: arredondar2((areaPecas / areaChapa) * 100),
      };
    });

    const areaPecasMm2 = unidades.reduce((s, u) => s + u.peca.larguraMm * u.peca.alturaMm, 0);
    const chapasUsadas = folhas.length;
    const areaChapasMm2 = chapasUsadas * areaChapa;
    const aproveitamentoPct = arredondar2((areaPecasMm2 / areaChapasMm2) * 100);
    const estoque = Math.max(0, Math.floor(chapa.qtdEstoque));
    const qtdDoEstoque = Math.min(estoque, chapasUsadas);
    const qtdCompra = chapasUsadas - qtdDoEstoque;

    materiais.push({
      chapa,
      chapasUsadas,
      planos,
      areaPecasMm2,
      areaChapasMm2,
      aproveitamentoPct,
      desperdicioPct: arredondar2(100 - aproveitamentoPct),
      qtdDoEstoque,
      qtdCompra,
      custoCompra: arredondar2(qtdCompra * chapa.custoUnitario),
      custoTotal: arredondar2(chapasUsadas * chapa.custoUnitario),
    });
  }

  const totalChapas = materiais.reduce((s, m) => s + m.chapasUsadas, 0);
  const areaPecasTotal = materiais.reduce((s, m) => s + m.areaPecasMm2, 0);
  const areaChapasTotal = materiais.reduce((s, m) => s + m.areaChapasMm2, 0);
  const aproveitamentoGeralPct = areaChapasTotal > 0 ? arredondar2((areaPecasTotal / areaChapasTotal) * 100) : 0;

  const listaCompra: ItemCompra[] = materiais
    .filter((m) => m.qtdCompra > 0)
    .map((m) => ({
      chapaId: m.chapa.id,
      nome: m.chapa.nome,
      quantidade: m.qtdCompra,
      custoUnitario: m.chapa.custoUnitario,
      custoTotal: m.custoCompra,
    }));

  return {
    materiais,
    totalChapas,
    aproveitamentoGeralPct,
    desperdicioGeralPct: totalChapas > 0 ? arredondar2(100 - aproveitamentoGeralPct) : 0,
    custoTotalChapas: arredondar2(materiais.reduce((s, m) => s + m.custoTotal, 0)),
    listaCompra,
    espessuraSerraMm: serra,
  };
}
