'use client';

import { RepositorioMemoria, type MedicaoLocal, type RepositorioMedicoes } from './fila-medicoes';

/** IndexedDB do PWA: medições pendentes (com fotos em Blob) e cache da lista de OS. */
const BANCO = 'arquijo-pwa';
const VERSAO = 1;

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BANCO, VERSAO);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('medicoes')) db.createObjectStore('medicoes', { keyPath: 'idLocal' });
      if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function emTransacao<T>(loja: string, modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return abrir().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(loja, modo);
        const req = fn(tx.objectStore(loja));
        tx.oncomplete = () => {
          db.close();
          resolve(req ? req.result : undefined);
        };
        tx.onerror = () => reject(tx.error);
      }),
  );
}

class RepositorioIndexedDb implements RepositorioMedicoes {
  async salvar(m: MedicaoLocal): Promise<void> {
    await emTransacao('medicoes', 'readwrite', (s) => s.put(m));
  }

  async listar(): Promise<MedicaoLocal[]> {
    return ((await emTransacao<MedicaoLocal[]>('medicoes', 'readonly', (s) => s.getAll())) ?? []) as MedicaoLocal[];
  }

  async atualizar(idLocal: string, parcial: Partial<MedicaoLocal>): Promise<void> {
    const atual = await emTransacao<MedicaoLocal>('medicoes', 'readonly', (s) => s.get(idLocal));
    if (atual) await this.salvar({ ...atual, ...parcial });
  }
}

export function repositorioMedicoes(): RepositorioMedicoes {
  return typeof indexedDB === 'undefined' ? new RepositorioMemoria() : new RepositorioIndexedDb();
}

export async function lerCache<T>(chave: string): Promise<T | undefined> {
  if (typeof indexedDB === 'undefined') return undefined;
  return emTransacao<T>('cache', 'readonly', (s) => s.get(chave));
}

export async function gravarCache(chave: string, valor: unknown): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  await emTransacao('cache', 'readwrite', (s) => s.put(valor, chave));
}

/** No logout: apaga a lista de OS em cache (medições pendentes são preservadas para não perder trabalho). */
export async function limparCache(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  await emTransacao('cache', 'readwrite', (s) => s.clear());
}
