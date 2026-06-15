import type { Logger, LogLevelNames as LogLevel } from 'loglevel';
import type { GetLogger } from 'loglevel-colored-level-prefix';
import { vi } from 'vitest';

const logger = {
  setLevel: vi.fn(),
  debug: vi.fn(getTestImplementation('debug')),
  error: vi.fn(getTestImplementation('error')),
  info: vi.fn(getTestImplementation('info')),
  trace: vi.fn(getTestImplementation('trace')),
  warn: vi.fn(getTestImplementation('warn')),
} as unknown as Logger;

const mock: (typeof getLogger)['mock'] = { clearAll, logger, logThings: [] };

const getLogger = (() => logger) as GetLogger;

Object.assign(getLogger, { mock });

export { mock };
export default getLogger;

function clearAll() {
  for (const name of Object.keys(logger) as LogLevel[]) {
    (logger[name] as ReturnType<typeof vi.fn>).mockClear();
  }
}

function getTestImplementation(level: LogLevel) {
  return testLogImplementation;

  function testLogImplementation(message: string, ...args: unknown[]) {
    if (mock.logThings === 'all' || mock.logThings.includes(level)) {
      console.log(level, message, ...args);
    }
  }
}
