import PDFDocument from 'pdfkit';
import { EMPRESA } from '../dominio/empresa';

/** Opções comuns dos geradores. `comprimir: false` deixa o texto legível (usado nos testes). */
export interface OpcoesPdf {
  comprimir?: boolean;
  agora?: Date;
}

type Doc = PDFKit.PDFDocument;

export const COR_MADEIRA = '#8f5e30';
export const COR_TEXTO = '#1e1e1c';
export const COR_SUAVE = '#7c776f';
const MARGEM = 48;

/** Moeda pt-BR com espaço comum (o Intl usa espaço não separável). */
export function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/ /g, ' ');
}

export function dataBr(d: Date | null | undefined): string {
  return d ? d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—';
}

export function cnpjFormatado(c: string): string {
  const d = c.replace(/\D/g, '');
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : c;
}

/** Cria o documento com cabeçalho da marca, executa `desenhar` e devolve o PDF em memória. */
export function gerarPdf(titulo: string, opcoes: OpcoesPdf, desenhar: (doc: Doc) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const agora = opcoes.agora ?? new Date();
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGEM,
      compress: opcoes.comprimir ?? true,
      bufferPages: true,
      info: { Title: `${titulo} — ${EMPRESA.nome}`, Author: EMPRESA.nome, Creator: 'Sistema Arquijo', CreationDate: agora },
    });
    const partes: Buffer[] = [];
    doc.on('data', (c: Buffer) => partes.push(c));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    try {
      cabecalho(doc, titulo);
      desenhar(doc);
      rodapes(doc, agora);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

function cabecalho(doc: Doc, titulo: string): void {
  doc.fillColor(COR_MADEIRA).font('Helvetica-Bold').fontSize(18).text(EMPRESA.nome);
  doc.fillColor(COR_SUAVE).font('Helvetica').fontSize(9).text(`${EMPRESA.endereco} · ${EMPRESA.telefone} · ${EMPRESA.horario}`);
  doc.text(`WhatsApp: ${EMPRESA.telefone} · ${EMPRESA.linkGoogle}`);
  const y = doc.y + 6;
  doc.moveTo(MARGEM, y).lineTo(doc.page.width - MARGEM, y).lineWidth(1).strokeColor(COR_MADEIRA).stroke();
  doc.moveDown(1.2);
  doc.fillColor(COR_TEXTO).font('Helvetica-Bold').fontSize(15).text(titulo);
  doc.moveDown(0.5);
}

function rodapes(doc: Doc, agora: Date): void {
  const paginas = doc.bufferedPageRange();
  for (let i = 0; i < paginas.count; i++) {
    doc.switchToPage(paginas.start + i);
    const margemInferior = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // permite escrever no rodapé sem abrir página nova
    doc
      .fillColor(COR_SUAVE)
      .font('Helvetica')
      .fontSize(8)
      .text(`${EMPRESA.nome} · ${EMPRESA.telefone} · gerado em ${dataBr(agora)} · página ${i + 1} de ${paginas.count}`, MARGEM, doc.page.height - 32, {
        width: doc.page.width - MARGEM * 2,
        align: 'center',
        lineBreak: false,
      });
    doc.page.margins.bottom = margemInferior;
  }
}

export function secao(doc: Doc, titulo: string): void {
  garantirEspaco(doc, 40);
  doc.moveDown(0.6);
  doc.fillColor(COR_MADEIRA).font('Helvetica-Bold').fontSize(11).text(titulo, MARGEM);
  doc.moveDown(0.2);
  doc.fillColor(COR_TEXTO).font('Helvetica').fontSize(10);
}

/** Pares rótulo: valor em uma coluna. */
export function campos(doc: Doc, pares: [string, string][]): void {
  for (const [r, v] of pares) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COR_TEXTO).text(`${r}: `, MARGEM, undefined, { continued: true });
    doc.font('Helvetica').text(v);
  }
}

function garantirEspaco(doc: Doc, altura: number): void {
  if (doc.y + altura > doc.page.height - doc.page.margins.bottom - 20) doc.addPage();
}

export interface Coluna {
  titulo: string;
  largura: number;
  alinhar?: 'left' | 'right' | 'center';
}

/** Tabela simples com cabeçalho repetido em quebra de página. */
export function tabela(doc: Doc, colunas: Coluna[], linhas: string[][]): void {
  const desenharCabecalho = () => {
    let x = MARGEM;
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COR_SUAVE);
    for (const c of colunas) {
      doc.text(c.titulo, x, y, { width: c.largura, align: c.alinhar ?? 'left', lineBreak: false });
      x += c.largura;
    }
    doc.y = y + 14;
    doc.moveTo(MARGEM, doc.y - 2).lineTo(MARGEM + colunas.reduce((s, c) => s + c.largura, 0), doc.y - 2).lineWidth(0.5).strokeColor('#d4cec3').stroke();
  };
  desenharCabecalho();
  doc.font('Helvetica').fontSize(9).fillColor(COR_TEXTO);
  for (const linha of linhas) {
    if (doc.y + 16 > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
      desenharCabecalho();
      doc.font('Helvetica').fontSize(9).fillColor(COR_TEXTO);
    }
    let x = MARGEM;
    const y = doc.y;
    linha.forEach((celula, i) => {
      const c = colunas[i]!;
      doc.text(celula, x, y, { width: c.largura - 4, align: c.alinhar ?? 'left', lineBreak: false, ellipsis: true });
      x += c.largura;
    });
    doc.y = y + 15;
  }
  doc.x = MARGEM;
}

/** Linha de total destacada à direita. */
export function total(doc: Doc, rotulo: string, valor: string): void {
  garantirEspaco(doc, 24);
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COR_TEXTO).text(`${rotulo}: ${valor}`, MARGEM, undefined, { align: 'right', width: doc.page.width - MARGEM * 2 });
  doc.font('Helvetica').fontSize(10);
}

export function paragrafo(doc: Doc, texto: string): void {
  doc.font('Helvetica').fontSize(10).fillColor(COR_TEXTO).text(texto, MARGEM, undefined, { width: doc.page.width - MARGEM * 2 });
}
