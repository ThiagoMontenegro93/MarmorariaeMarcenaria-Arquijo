import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Testes das funções puras do front (sessão, permissões, desenho do plano, fila offline).
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./', import.meta.url)) } },
  test: { include: ['test/**/*.test.ts'], environment: 'node' },
});
