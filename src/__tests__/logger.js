/* eslint no-console:0 */
import loglevel from 'loglevel';
import chalk from 'chalk';
import getLogger from '../logger';

const logMap = {
  trace: 'trace',
  debug: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error'
};

beforeEach(() => {
  Object.keys(logMap).forEach(logLevel => {
    console[logMap[logLevel]] = jest.fn();
  });
});

Object.keys(logMap).forEach(logLevel => {
  const logMethod = logMap[logLevel];
  test(`${logLevel} logs to console.${logMethod}`, () => {
    const prefix = String(Math.random());
    const logger = getLogger({ level: 'trace', prefix });
    const message = `Help me Obi Wan Kenobi. You're my only hope.`;
    logger[logLevel](message);
    expect(console[logMethod]).toHaveBeenCalledTimes(1);
    const logPrefix = expect.stringMatching(
      new RegExp(`${prefix}.*${logLevel.toUpperCase()}`)
    );
    expect(console[logMethod]).toHaveBeenCalledWith(logPrefix, message);
  });
});

test('returns the same instance of logger with the same prefix', () => {
  const prefix = String(Math.random());
  const logger1 = getLogger({ prefix });
  const logger2 = getLogger({ prefix });
  expect(logger2).toBe(logger1);
});

test('defaults to process.env.LOG_LEVEL if it exists', () => {
  const originalLogLevel = process.env.LOG_LEVEL;
  process.env.LOG_LEVEL = 'debug';
  const logger = getLogger({ prefix: String(Math.random()) });
  expect(logger.getLevel()).toBe(
    loglevel.levels[process.env.LOG_LEVEL.toUpperCase()]
  );
  process.env.LOG_LEVEL = originalLogLevel;
});

test('defaults to `warn` if process.env.LOG_LEVEL does not exit', () => {
  const originalLogLevel = process.env.LOG_LEVEL;
  delete process.env.LOG_LEVEL;
  const logger = getLogger({ prefix: String(Math.random()) });
  expect(logger.getLevel()).toBe(loglevel.levels.WARN);
  process.env.LOG_LEVEL = originalLogLevel;
});

test(`defaults the prefix to an empty string`, () => {
  const message = `hi default!`;
  const logger = getLogger();
  logger.warn(message);
  expect(console.warn).toHaveBeenCalledTimes(1);
  const {
    mock: {
      calls: [[firstCallFirstArg]]
    }
  } = console.warn;
  const prefix = `${chalk.yellow('[WARN]')}:`;
  expect(firstCallFirstArg).toBe(prefix);
});
