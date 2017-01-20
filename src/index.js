/* eslint no-console:0, global-require:0, import/no-dynamic-require:0 */
import path from 'path'
import requireRelative from 'require-relative'
import {getPrettierOptionsFromESLintRules} from './utils'

const options = {disableLog: false, sillyLogs: false}
// CommonJS + ES6 modules... is it worth it? Probably not...
module.exports = format
module.exports.options = options

/**
 * Formats the text with prettier and then eslint based on the given options
 * @param {String} options.text - the text (JavaScript code) to format
 * @param {String} options.filePath - the path of the file being formatted
 *  can be used in leu of `eslintConfig` (eslint will be used to find the
 *  relevant config for the file)
 * @param {String} options.eslintPath - the path to the eslint module to use.
 *   Will default to require.resolve('eslint')
 * @param {String} options.prettierPath - the path to the prettier module to use.
 *   Will default to require.resovlve('prettierPath')
 * @param {Boolean} options.disableLog - disables any logging
 * @param {String} options.eslintConfig - the config to use for formatting
 *  with ESLint.
 * @param {Object} options.prettierOptions - the options to pass for
 *  formatting with `prettier`. If not provided, prettier-eslint will attempt
 *  to create the options based on the eslintConfig
 * @param {Boolean} options.sillyLogs - enables silly logging (default: false)
 * @return {String} - the formatted string
 */
function format({
  text,
  filePath,
  eslintPath = getModulePath(filePath, 'eslint'),
  prettierPath = getModulePath(filePath, 'prettier'),
  disableLog = options.disableLog,
  eslintConfig = getConfig(filePath, eslintPath),
  prettierOptions = getPrettierOptionsFromESLintRules(eslintConfig),
  sillyLogs = options.sillyLogs,
}) {
  const originalLogValue = options.disableLog
  options.disableLog = disableLog
  logSilliness(sillyLogs, eslintConfig, prettierOptions)

  try {
    // console.log('text', text)
    const pretty = prettify(text, prettierOptions, prettierPath)
    // console.log('pretty', pretty)
    const eslintFixed = eslintFix(pretty, eslintConfig, eslintPath)
    // console.log('eslintFixed', eslintFixed)
    return eslintFixed
  } finally {
    options.disableLog = originalLogValue
  }
}

function prettify(text, formatOptions, prettierPath) {
  let prettier
  try {
    prettier = require(prettierPath)
  } catch (error) {
    logError(`There was trouble getting prettier. Is "prettierPath: ${prettierPath}" a correct path to the prettier module?`)
    throw error
  }
  try {
    return prettier.format(text, formatOptions)
  } catch (error) {
    // is this noisy? Try setting options.disableLog to false
    logError('prettier formatting failed', error.stack)
    throw error
  }
}

function eslintFix(text, eslintConfig, eslintPath) {
  const eslintOptions = {
    // overrideables
    useEslintrc: false,

    // user-given config
    ...eslintConfig,

    // overrides
    fix: true,
    // there's some trouble with `globals`...
    // I'm pretty sure it's not necessary to have them
    // for a --fix though so :shrug:
    globals: [],
  }
  const eslint = getESLintCLIEngine(eslintPath, eslintOptions)
  try {
    const report = eslint.executeOnText(text)
    // default the output to text because if there's nothing
    // to fix, eslint doesn't provide `output`
    const [{output = text}] = report.results
    // NOTE: We're ignoring linting errors/warnings here and
    // defaulting to the given text if there are any
    // because all we're trying to do is fix what we can.
    // We don't care about what we can't
    return output
  } catch (error) {
    // is this noisy? Try setting options.disableLog to false
    logError('eslint fix failed', error.stack)
    throw error
  }
}

function getConfig(filePath, eslintPath) {
  const eslintOptions = {}
  if (filePath) {
    eslintOptions.cwd = path.dirname(filePath)
  }
  const configFinder = getESLintCLIEngine(eslintPath, eslintOptions)
  try {
    const config = configFinder.getConfigForFile(filePath)
    return config
  } catch (error) {
    // is this noisy? Try setting options.disableLog to false
    logError('Unable to find config', error.stack)
    throw error
  }
}

function getModulePath(filePath = __filename, moduleName) {
  return requireRelative.resolve(moduleName, filePath)
}

function getESLintCLIEngine(eslintPath, eslintOptions) {
  try {
    const {CLIEngine} = require(eslintPath)
    return new CLIEngine(eslintOptions)
  } catch (error) {
    logError(`There was trouble creating the ESLint CLIEngine. Is "eslintPath: ${eslintPath}" a correct path to the ESLint module?`)
    throw error
  }
}

function logError(...args) {
  if (!options.disableLog) {
    console.error('prettier-eslint error:', ...args)
  }
}

function logSilliness(sillyLogs, eslintConfig, prettierOptions) {
  if (sillyLogs) {
    console.log('😜 logs for eslintConfig and prettierOptions:')
    console.dir({
      eslintConfig,
      prettierOptions,
    }, null, true)
  }
}
