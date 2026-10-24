'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { enviarMedicao, prepararFoto } from '@/lib/enviar-medicao';
import { novaMedicao, sincronizar, validarMedicao, type MedicaoLocal, type Parede } from '@/lib/fila-medicoes';
import { dataHora } from '@/lib/formato';
import { gravarCache, lerCache, repositorioMedicoes } from '@/lib/idb-medicoes';

interface OsOpcao {
  id: string;
  codigo: string;
  ambiente: string;
  cliente: { nome: string };
}

const PAREDE_PADRAO: Parede = { nome: 'Parede A', larguraMm: 0, alturaMm: 0 };
const ROTULO_ESTADO = { pendente: 'Pendente', sincronizada: 'Sincronizada', erro: 'Erro' } as const;
const COR_ESTADO = { pendente: 'bg-amber-100 text-amber-900', sincronizada: 'bg-green-100 text-green-800', erro: 'bg-red-100 text-red-800' } as const;

/** Tela de medição para celular: funciona offline (IndexedDB) e sincroniza quando a rede volta. */
export function TelaMedicao() {
  const repo = useRef(repositorioMedicoes());
  const [online, setOnline] = useState(true);
  const [ordens, setOrdens] = useState<OsOpcao[]>([]);
  const [medicoes, setMedicoes] = useState<MedicaoLocal[]>([]);
  const [paredes, setParedes] = useState<Parede[]>([{ ...PAREDE_PADRAO }]);
  const [fotos, setFotos] = useState<File[]>([]);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const sincronizando = useRef(false);

  const recarregar = useCallback(async () => {
    const lista = await repo.current.listar();
    setMedicoes(lista.sort((a, b) => b.medidoEm.localeCompare(a.medidoEm)));
  }, []);

  const sincronizarAgora = useCallback(async () => {
    if (sincronizando.current || !navigator.onLine) return;
    sincronizando.current = true;
    try {
      const r = await sincronizar(repo.current, enviarMedicao);
      if (r.enviadas || r.falhas) {
        setMensagem(
          r.falhas
            ? { tipo: 'erro', texto: `${r.enviadas} sincronizada(s), ${r.falhas} com erro.` }
            : { tipo: 'ok', texto: `${r.enviadas} medição(ões) sincronizada(s).` },
        );
      }
    } finally {
      sincronizando.current = false;
      await recarregar();
    }
  }, [recarregar]);

  useEffect(() => {
    setOnline(navigator.onLine);
    void recarregar();
    // Lista de OS: rede quando possível, cache local quando offline.
    void (async () => {
      try {
        if (!navigator.onLine) throw new Error('offline');
        const r = await fetch('/api/proxy/ordens-servico');
        if (!r.ok) throw new Error(String(r.status));
        const lista = ((await r.json()) as (OsOpcao & { status: string })[]).filter((o) => o.status !== 'FINALIZADO');
        setOrdens(lista);
        await gravarCache('ordens', lista);
      } catch {
        setOrdens((await lerCache<OsOpcao[]>('ordens')) ?? []);
      }
    })();
    void sincronizarAgora();
    const aoConectar = () => {
      setOnline(true);
      void sincronizarAgora();
    };
    const aoDesconectar = () => setOnline(false);
    window.addEventListener('online', aoConectar);
    window.addEventListener('offline', aoDesconectar);
    return () => {
      window.removeEventListener('online', aoConectar);
      window.removeEventListener('offline', aoDesconectar);
    };
  }, [recarregar, sincronizarAgora]);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const osId = String(f.get('ordemServicoId') ?? '');
    const dados = {
      ordemServicoId: osId,
      osCodigo: ordens.find((o) => o.id === osId)?.codigo ?? '',
      ambiente: String(f.get('ambiente') ?? ''),
      paredes,
      observacoes: String(f.get('observacoes') ?? ''),
      fotos: await Promise.all(fotos.map(prepararFoto)),
    };
    const erros = validarMedicao(dados);
    if (erros.length) {
      setMensagem({ tipo: 'erro', texto: erros.join(' ') });
      return;
    }
    await repo.current.salvar(novaMedicao(dados, new Date(), () => crypto.randomUUID()));
    form.reset();
    setParedes([{ ...PAREDE_PADRAO }]);
    setFotos([]);
    setMensagem({ tipo: 'ok', texto: navigator.onLine ? 'Medição salva. Sincronizando…' : 'Medição salva no aparelho. Será enviada quando a internet voltar.' });
    await recarregar();
    void sincronizarAgora();
  }

  async function tentarDeNovo(idLocal: string) {
    await repo.current.atualizar(idLocal, { estado: 'pendente', erro: undefined });
    await sincronizarAgora();
  }

  const pendentes = medicoes.filter((m) => m.estado === 'pendente').length;
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="titulo-pagina">Medição na obra</h1>
        <span data-testid="status-rede" className={`rounded-full px-3 py-1 text-xs font-semibold ${online ? 'bg-green-100 text-green-800' : 'bg-stone-700 text-white'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      </div>

      {mensagem && (
        <p role={mensagem.tipo === 'erro' ? 'alert' : 'status'} className={`rounded-lg px-3 py-2 text-sm ${mensagem.tipo === 'erro' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {mensagem.texto}
        </p>
      )}

      <form onSubmit={salvar} className="cartao space-y-3" aria-label="Nova medição">
        <label className="block">
          <span className="rotulo">Ordem de serviço</span>
          <select name="ordemServicoId" required className="campo mt-1 text-base">
            <option value="">Escolha…</option>
            {ordens.map((o) => (
              <option key={o.id} value={o.id}>
                {o.codigo} · {o.cliente.nome} · {o.ambiente}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="rotulo">Ambiente</span>
          <input name="ambiente" required minLength={2} placeholder="ex.: Cozinha" className="campo mt-1 text-base" />
        </label>

        <fieldset className="space-y-2">
          <legend className="rotulo">Paredes (mm)</legend>
          {paredes.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_88px_88px_28px] gap-2">
              <input aria-label={`Nome da parede ${i + 1}`} value={p.nome} onChange={(e) => setParedes(paredes.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))} className="campo text-base" />
              <input aria-label={`Largura da parede ${i + 1}`} inputMode="numeric" type="number" min={1} placeholder="Larg." value={p.larguraMm || ''} onChange={(e) => setParedes(paredes.map((x, j) => (j === i ? { ...x, larguraMm: Number(e.target.value) } : x)))} className="campo text-base" />
              <input aria-label={`Altura da parede ${i + 1}`} inputMode="numeric" type="number" min={1} placeholder="Alt." value={p.alturaMm || ''} onChange={(e) => setParedes(paredes.map((x, j) => (j === i ? { ...x, alturaMm: Number(e.target.value) } : x)))} className="campo text-base" />
              <button type="button" aria-label={`Remover parede ${i + 1}`} className="text-red-700" onClick={() => setParedes(paredes.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="botao-sec w-full" onClick={() => setParedes([...paredes, { nome: `Parede ${String.fromCharCode(65 + paredes.length)}`, larguraMm: 0, alturaMm: 0 }])}>
            + Parede
          </button>
        </fieldset>

        <label className="block">
          <span className="rotulo">Observações</span>
          <textarea name="observacoes" rows={3} maxLength={4000} placeholder="Tomadas, pontos de água, prumo…" className="campo mt-1 text-base" />
        </label>
        <label className="block">
          <span className="rotulo">Fotos (até 6)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            multiple
            aria-label="Fotos"
            onChange={(e) => setFotos(Array.from(e.target.files ?? []).slice(0, 6))}
            className="mt-1 block w-full text-sm"
          />
          {fotos.length > 0 && <span className="text-xs text-stone-500">{fotos.length} foto(s) selecionada(s)</span>}
        </label>
        <button className="botao w-full py-3 text-base">Salvar medição</button>
      </form>

      <section className="cartao" aria-labelledby="t-fila">
        <div className="flex items-center justify-between">
          <h2 id="t-fila" className="font-semibold">
            Neste aparelho
          </h2>
          <button type="button" className="botao-sec px-3 py-1 text-xs" disabled={!online || pendentes === 0} onClick={() => void sincronizarAgora()}>
            Sincronizar agora ({pendentes})
          </button>
        </div>
        <ul className="mt-2 divide-y divide-linha text-sm">
          {medicoes.map((m) => (
            <li key={m.idLocal} className="py-2" data-testid="medicao-item">
              <div className="flex items-center justify-between gap-2">
                <span>
                  <strong>{m.osCodigo}</strong> · {m.ambiente} · {m.paredes.length} parede(s) · {m.fotos.length} foto(s)
                </span>
                <span data-testid="medicao-estado" className={`rounded px-2 py-0.5 text-xs font-semibold ${COR_ESTADO[m.estado]}`}>
                  {ROTULO_ESTADO[m.estado]}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                medido {dataHora(m.medidoEm)}
                {m.sincronizadaEm ? ` · enviado ${dataHora(m.sincronizadaEm)}` : ''}
              </p>
              {m.erro && m.estado !== 'sincronizada' && <p className="text-xs text-red-700">{m.erro}</p>}
              {m.estado === 'erro' && (
                <button type="button" className="text-xs text-marca-escura underline" onClick={() => void tentarDeNovo(m.idLocal)}>
                  Tentar de novo
                </button>
              )}
            </li>
          ))}
          {medicoes.length === 0 && <li className="py-2 text-stone-500">Nenhuma medição salva.</li>}
        </ul>
      </section>
    </div>
  );
}
