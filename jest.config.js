// @ts-check

/** @import { Config } from 'jest' */

module.exports = /** @satisfies {Config} */ ({
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': '@swc-node/jest',
  },
});
