import {getLogger} from 'loglevel'
import chalk from 'chalk'

let logger

export default setupLogger

function setupLogger(level = 'WARN') {
  if (logger) {
    return logger
  }
  const prefix = chalk.dim('prettier-eslint')
  const levelPrefix = {
    TRACE: chalk.dim('[TRACE]'),
    DEBUG: chalk.cyan('[DEBUG]'),
    INFO: chalk.blue('[INFO]'),
    WARN: chalk.yellow('[WARN]'),
    ERROR: chalk.red('[ERROR]'),
  }

  logger = getLogger(`prettier-eslint-logger`)

  // this is the plugin "api"
  const originalFactory = logger.methodFactory
  logger.methodFactory = methodFactory

  const originalSetLevel = logger.setLevel
  logger.setLevel = setLevel
  logger.setLevel(level)
  return logger

  // this is the plugin "api"
  function methodFactory(...factoryArgs) {
    const {0: logLevel} = factoryArgs
    const rawMethod = originalFactory(...factoryArgs)
    return (...args) =>
      rawMethod(`${prefix} ${levelPrefix[logLevel.toUpperCase()]}:`, ...args)
  }

  function setLevel(levelToSetTo) {
    const persist = false // uses browser localStorage
    return originalSetLevel.call(logger, levelToSetTo, persist)
  }
}
