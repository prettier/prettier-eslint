import type { Logger, LogLevelNames as LogLevel } from 'loglevel';
import type { GetLogger } from 'loglevel-colored-level-prefix';

const logger: Logger = {
  setLevel: jest.fn(),
  debug: jest.fn(getTestImplementation('debug')),
  error: jest.fn(getTestImplementation('error')),
  info: jest.fn(getTestImplementation('info')),
  // @ts-expect-error - loglevel's typings are wrong for this method
  silent: jest.fn(getTestImplementation('silent')),
  trace: jest.fn(getTestImplementation('trace')),
  warn: jest.fn(getTestImplementation('warn')),
};

const mock: (typeof getLogger)['mock'] = { clearAll, logger, logThings: [] };

const getLogger = (() => logger) as GetLogger;

Object.assign(getLogger, { mock });

export = getLogger;

function clearAll() {
  for (const name of Object.keys(logger) as LogLevel[]) {
    (logger[name] as jest.Mock).mockClear();
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
