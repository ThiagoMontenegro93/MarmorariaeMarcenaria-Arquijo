/** Extrai o texto de um PDF gerado pelo pdfkit sem compressão (operadores TJ com strings hex WinAnsi). */
export function extrairTexto(pdf: Buffer): string {
  const bruto = pdf.toString('latin1');
  const decoder = new TextDecoder('windows-1252');
  const linhas: string[] = [];
  for (const m of bruto.matchAll(/\[(.*?)\] TJ/g)) {
    const partes = [...m[1]!.matchAll(/<([0-9a-fA-F]*)>/g)].map((h) => decoder.decode(Buffer.from(h[1]!, 'hex')));
    linhas.push(partes.join(''));
  }
  return linhas.join('\n');
}
