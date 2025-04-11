import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/node_modules/**', '**/fixtures/**', '**/__mocks__/**'],
      include: ['src/**/*.js'],
      thresholds: {
        branches: 96,
        functions: 100,
        lines: 100,
        statements: 100,
      }
    },
    exclude: ['**/node_modules/**', '**/fixtures/**', '**/__mocks__/**'],
  },
});
