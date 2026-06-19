import type { Logger, LogLevelDesc, LogLevelNames as LogLevel } from 'loglevel';
import type { GetLogger } from 'loglevel-colored-level-prefix';
import { vi, type Mock } from 'vitest';

const levels = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, SILENT: 5 };

let currentLevel = levels.WARN;

const getLevel = vi.fn(() => currentLevel);
const setLevel = vi.fn((level: LogLevelDesc) => {
  currentLevel = normalizeLogLevel(level);
});
const debug = vi.fn(getTestImplementation('debug'));
const error = vi.fn(getTestImplementation('error'));
const info = vi.fn(getTestImplementation('info'));
const trace = vi.fn(getTestImplementation('trace'));
const warn = vi.fn(getTestImplementation('warn'));

const logger = {
  levels,
  getLevel,
  setLevel,
  debug,
  error,
  info,
  trace,
  warn,
} as unknown as Logger;

const mockedMethods: Mock[] = [
  getLevel,
  setLevel,
  debug,
  error,
  info,
  trace,
  warn,
];

const mock: (typeof getLogger)['mock'] = { clearAll, logger, logThings: [] };

const getLogger = (() => logger) as GetLogger;

Object.assign(getLogger, { mock });

export { mock };
export default getLogger;

function clearAll() {
  currentLevel = levels.WARN;
  for (const method of mockedMethods) {
    method.mockClear();
  }
}

function normalizeLogLevel(level: LogLevelDesc) {
  if (typeof level === 'string') {
    return levels[level.toUpperCase() as keyof typeof levels];
  }
  return level;
}

function getTestImplementation(level: LogLevel) {
  return testLogImplementation;

  function testLogImplementation(message: string, ...args: unknown[]) {
    if (mock.logThings === 'all' || mock.logThings.includes(level)) {
      console.log(level, message, ...args);
    }
  }
}
