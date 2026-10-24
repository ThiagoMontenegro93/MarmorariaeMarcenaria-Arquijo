import { describe, expect, it } from 'vitest';
import { novaMedicao, RepositorioMemoria, sincronizar, validarMedicao, type MedicaoLocal } from '@/lib/fila-medicoes';

const base = {
  ordemServicoId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  osCodigo: 'OS-101',
  ambiente: 'Cozinha',
  paredes: [{ nome: 'A', larguraMm: 3200, alturaMm: 2700 }],
  observacoes: '',
  fotos: [],
};
let n = 0;
const gerarId = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;

describe('validarMedicao', () => {
  it('exige OS, ambiente e paredes com medidas positivas', () => {
    expect(validarMedicao(base)).toEqual([]);
    expect(validarMedicao({ ...base, ordemServicoId: '' })).toContain('Escolha a OS.');
    expect(validarMedicao({ ...base, ambiente: 'x' })).toContain('Informe o ambiente.');
    expect(validarMedicao({ ...base, paredes: [{ nome: 'A', larguraMm: 0, alturaMm: 10 }] })).toContain('Parede "A": medidas devem ser maiores que zero.');
  });
});

describe('novaMedicao', () => {
  it('cria pendente com id local e data do aparelho', () => {
    const m = novaMedicao(base, new Date('2026-10-24T10:00:00Z'), gerarId);
    expect(m.estado).toBe('pendente');
    expect(m.tentativas).toBe(0);
    expect(m.medidoEm).toBe('2026-10-24T10:00:00.000Z');
    expect(m.idLocal).toMatch(/^00000000-/);
  });
});

describe('sincronizar', () => {
  function repoCom(...ms: MedicaoLocal[]) {
    const r = new RepositorioMemoria();
    return Promise.all(ms.map((m) => r.salvar(m))).then(() => r);
  }

  it('envia pendentes em ordem e marca como sincronizadas', async () => {
    const a = novaMedicao(base, new Date('2026-10-24T10:00:00Z'), gerarId);
    const b = novaMedicao({ ...base, ambiente: 'Sala' }, new Date('2026-10-24T09:00:00Z'), gerarId);
    const repo = await repoCom(a, b);
    const enviadas: string[] = [];
    const r = await sincronizar(repo, async (m) => {
      enviadas.push(m.ambiente);
      return { ok: true };
    });
    expect(enviadas).toEqual(['Sala', 'Cozinha']);
    expect(r).toEqual({ enviadas: 2, falhas: 0, restantes: 0 });
    expect((await repo.listar()).every((m) => m.estado === 'sincronizada')).toBe(true);
  });

  it('para no primeiro erro de rede e mantém pendente para tentar depois', async () => {
    const a = novaMedicao(base, new Date('2026-10-24T09:00:00Z'), gerarId);
    const b = novaMedicao(base, new Date('2026-10-24T10:00:00Z'), gerarId);
    const repo = await repoCom(a, b);
    let chamadas = 0;
    const r = await sincronizar(repo, async () => {
      chamadas++;
      throw new TypeError('Failed to fetch');
    });
    expect(chamadas).toBe(1);
    expect(r.restantes).toBe(2);
    const lista = await repo.listar();
    expect(lista.find((m) => m.idLocal === a.idLocal)).toMatchObject({ estado: 'pendente', tentativas: 1 });
  });

  it('erro definitivo (dados inválidos) marca como erro e segue com as próximas', async () => {
    const a = novaMedicao(base, new Date('2026-10-24T09:00:00Z'), gerarId);
    const b = novaMedicao(base, new Date('2026-10-24T10:00:00Z'), gerarId);
    const repo = await repoCom(a, b);
    const r = await sincronizar(repo, async (m) => (m.idLocal === a.idLocal ? { ok: false, erro: 'OS não encontrada.', definitivo: true } : { ok: true }));
    expect(r).toEqual({ enviadas: 1, falhas: 1, restantes: 0 });
    expect((await repo.listar()).find((m) => m.idLocal === a.idLocal)).toMatchObject({ estado: 'erro', erro: 'OS não encontrada.' });
  });

  it('não reenvia o que já foi sincronizado', async () => {
    const a = { ...novaMedicao(base, new Date(), gerarId), estado: 'sincronizada' as const };
    const repo = await repoCom(a);
    let chamadas = 0;
    await sincronizar(repo, async () => {
      chamadas++;
      return { ok: true };
    });
    expect(chamadas).toBe(0);
  });
});
