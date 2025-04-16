import type { Options } from '@swc-node/core';
import type { Config } from 'jest';

export default {
  collectCoverage: true,
  collectCoverageFrom: ['src/*.ts'],
  coverageThreshold: {
    global: {
      branches: 96,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['@swc-node/jest', {} satisfies Options],
  },
} satisfies Config;
