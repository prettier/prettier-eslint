import loglevel from 'loglevel';
import chalk from 'chalk';

const loggers = {};

function getLogger({ level = getDefaultLevel(), prefix = '' } = {}) {
  if (loggers[prefix]) {
    return loggers[prefix];
  }
  const coloredPrefix = prefix ? `${chalk.dim(prefix)} ` : '';
  const levelPrefix = {
    TRACE: chalk.dim('[TRACE]'),
    DEBUG: chalk.cyan('[DEBUG]'),
    INFO: chalk.blue('[INFO]'),
    WARN: chalk.yellow('[WARN]'),
    ERROR: chalk.red('[ERROR]')
  };

  const logger = loglevel.getLogger(`${prefix}-logger`);

  // this is the plugin "api"
  const originalFactory = logger.methodFactory;
  logger.methodFactory = methodFactory;

  const originalSetLevel = logger.setLevel;
  logger.setLevel = setLevel;
  logger.setLevel(level);
  loggers[prefix] = logger;
  return logger;

  function methodFactory(...factoryArgs) {
    const { 0: logLevel } = factoryArgs;
    const rawMethod = originalFactory(...factoryArgs);
    return (...args) =>
      rawMethod(
        `${coloredPrefix}${levelPrefix[logLevel.toUpperCase()]}:`,
        ...args
      );
  }

  function setLevel(levelToSetTo) {
    const persist = false; // uses browser localStorage
    return originalSetLevel.call(logger, levelToSetTo, persist);
  }
}

function getDefaultLevel() {
  const { LOG_LEVEL: logLevel } = process.env;
  if (logLevel === 'undefined' || !logLevel) {
    return 'warn';
  }
  return logLevel;
}

export default getLogger;
