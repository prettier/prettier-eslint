import { vi } from 'vitest';

const logger = {
  setLevel: vi.fn(),
  trace: vi.fn(getTestImplementation('trace')),
  debug: vi.fn(getTestImplementation('debug')),
  info: vi.fn(getTestImplementation('info')),
  warn: vi.fn(getTestImplementation('warn')),
  error: vi.fn(getTestImplementation('error'))
};

const logThings = [];

function mockClear() {
  Object.values(logger).forEach((mock) => {
    mock.mockClear();
  });
}

function getTestImplementation(level) {
  return function testLogImplementation(...args) {
    if (logThings === 'all' || logThings.indexOf(level) !== -1) {
      console.log(level, ...args); // eslint-disable-line no-console
    }
  }
}

export default function getLogger() {
  return logger;
}

export const helpers = { mockClear, getLogger: () => logger, logThings };
