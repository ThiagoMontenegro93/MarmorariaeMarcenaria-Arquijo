import { defineConfig } from 'vitest/config';

// Testes unitários das regras de negócio puras (sem banco e sem injeção de dependência).
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
