/** Erros de domínio do motor de cálculo — mensagens claras em português. */

export class ErroCalculo extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = new.target.name;
  }
}

/** Entrada inválida (medida, quantidade, valor negativo...). */
export class ErroValidacaoCalculo extends ErroCalculo {}

/** A peça não cabe na chapa nem girando (ou não pode girar por causa do veio). */
export class PecaMaiorQueChapaError extends ErroCalculo {
  constructor(
    public readonly peca: { nome: string; larguraMm: number; alturaMm: number; veio: boolean },
    public readonly chapa: { nome: string; larguraMm: number; alturaMm: number },
  ) {
    const motivo = peca.veio
      ? 'a peça tem veio e não pode ser rotacionada'
      : 'nem rotacionando a peça';
    super(
      `Peça "${peca.nome}" (${peca.larguraMm}x${peca.alturaMm} mm) não cabe na chapa ` +
        `"${chapa.nome}" (${chapa.larguraMm}x${chapa.alturaMm} mm): ${motivo}.`,
    );
  }
}

/** A peça referencia um material/chapa que não foi informado. */
export class MaterialNaoEncontradoError extends ErroCalculo {
  constructor(public readonly chapaId: string, nomePeca: string) {
    super(`Material/chapa "${chapaId}" da peça "${nomePeca}" não está cadastrado.`);
  }
}
