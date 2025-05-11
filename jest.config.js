// @ts-check

/** @import { Config } from 'jest' */

module.exports = /** @satisfies {Config} */ ({
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 96,
      functions: 100,
      lines: 99,
      statements: 98,
    },
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': '@swc-node/jest',
  },
});
