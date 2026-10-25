/**
 * Fila offline de medições (RNF03). Lógica pura e testável; o armazenamento real
 * (IndexedDB) implementa RepositorioMedicoes em lib/idb-medicoes.ts.
 */

export interface Parede {
  nome: string;
  larguraMm: number;
  alturaMm: number;
}

export interface DadosMedicao {
  ordemServicoId: string;
  osCodigo: string;
  ambiente: string;
  paredes: Parede[];
  observacoes: string;
  /** Fotos como Blob/File (IndexedDB guarda blobs nativamente). */
  fotos: Blob[];
}

export type EstadoMedicao = 'pendente' | 'sincronizada' | 'erro';

export interface MedicaoLocal extends DadosMedicao {
  idLocal: string;
  medidoEm: string;
  estado: EstadoMedicao;
  tentativas: number;
  erro?: string;
  sincronizadaEm?: string;
}

export interface RepositorioMedicoes {
  salvar(m: MedicaoLocal): Promise<void>;
  listar(): Promise<MedicaoLocal[]>;
  atualizar(idLocal: string, parcial: Partial<MedicaoLocal>): Promise<void>;
}

export type ResultadoEnvio = { ok: true } | { ok: false; erro: string; definitivo: boolean };

export function validarMedicao(d: Pick<DadosMedicao, 'ordemServicoId' | 'ambiente' | 'paredes'>): string[] {
  const erros: string[] = [];
  if (!d.ordemServicoId) erros.push('Escolha a OS.');
  if (d.ambiente.trim().length < 2) erros.push('Informe o ambiente.');
  for (const p of d.paredes) {
    if (!(p.larguraMm > 0) || !(p.alturaMm > 0)) erros.push(`Parede "${p.nome}": medidas devem ser maiores que zero.`);
  }
  return erros;
}

export function novaMedicao(d: DadosMedicao, agora: Date, gerarId: () => string): MedicaoLocal {
  return { ...d, ambiente: d.ambiente.trim(), idLocal: gerarId(), medidoEm: agora.toISOString(), estado: 'pendente', tentativas: 0 };
}

/**
 * Envia as medições pendentes (mais antigas primeiro).
 * - Sucesso: marca sincronizada.
 * - Erro definitivo (4xx de validação): marca erro e segue para a próxima.
 * - Falha de rede (exceção): para tudo e mantém pendente para a próxima tentativa.
 * O servidor é idempotente pelo idLocal, então reenviar é seguro.
 */
export async function sincronizar(
  repo: RepositorioMedicoes,
  enviar: (m: MedicaoLocal) => Promise<ResultadoEnvio>,
  agora: () => Date = () => new Date(),
): Promise<{ enviadas: number; falhas: number; restantes: number }> {
  const fila = (await repo.listar()).filter((m) => m.estado === 'pendente').sort((a, b) => a.medidoEm.localeCompare(b.medidoEm));
  let enviadas = 0;
  let falhas = 0;
  for (let i = 0; i < fila.length; i++) {
    const m = fila[i]!;
    try {
      const r = await enviar(m);
      if (r.ok) {
        await repo.atualizar(m.idLocal, { estado: 'sincronizada', sincronizadaEm: agora().toISOString(), erro: undefined, tentativas: m.tentativas + 1 });
        enviadas++;
      } else if (r.definitivo) {
        await repo.atualizar(m.idLocal, { estado: 'erro', erro: r.erro, tentativas: m.tentativas + 1 });
        falhas++;
      } else {
        await repo.atualizar(m.idLocal, { erro: r.erro, tentativas: m.tentativas + 1 });
        return { enviadas, falhas, restantes: fila.length - i };
      }
    } catch (e) {
      await repo.atualizar(m.idLocal, { erro: (e as Error).message, tentativas: m.tentativas + 1 });
      return { enviadas, falhas, restantes: fila.length - i };
    }
  }
  return { enviadas, falhas, restantes: 0 };
}

/** Repositório em memória (testes e fallback quando IndexedDB não existe). */
export class RepositorioMemoria implements RepositorioMedicoes {
  private readonly itens = new Map<string, MedicaoLocal>();

  async salvar(m: MedicaoLocal): Promise<void> {
    this.itens.set(m.idLocal, { ...m });
  }

  async listar(): Promise<MedicaoLocal[]> {
    return [...this.itens.values()].map((m) => ({ ...m }));
  }

  async atualizar(idLocal: string, parcial: Partial<MedicaoLocal>): Promise<void> {
    const atual = this.itens.get(idLocal);
    if (atual) this.itens.set(idLocal, { ...atual, ...parcial });
  }
}
