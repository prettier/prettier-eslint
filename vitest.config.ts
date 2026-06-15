import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'prettier-eslint': new URL('src/index.ts', import.meta.url).href,
    },
  },
  test: {
    coverage: {
      include: ['src/**/*.ts'],
      thresholds: {
        branches: 94,
        functions: 100,
        lines: 99,
        statements: 98,
      },
    },
    environment: 'node',
    globals: true,
  },
});
