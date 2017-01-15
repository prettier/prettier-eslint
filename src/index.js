/* eslint no-console:0 */
import path from 'path'
import {CLIEngine} from 'eslint'
import prettier from 'prettier'
import {getPrettierOptionsFromESLintRules} from './utils'

const options = {disableLog: false}
// CommonJS + ES6 modules... is it worth it? Probably not...
module.exports = format
module.exports.options = options

/**
 * Formats the text with prettier and then eslint based on the given options
 * @param {String} options.text - the text (JavaScript code) to format
 * @param {String} options.filePath - the path of the file being formatted
 *  can be used in leu of `eslintConfig` (eslint will be used to find the
 *  relevant config for the file)
 * @param {Boolean} options.disableLog - disables any logging
 * @param {String} options.eslintConfig - the config to use for formatting
 *  with ESLint.
 * @param {Object} options.prettierOptions - the options to pass for
 *  formatting with `prettier`. If not provided, prettier-eslint will attempt
 *  to create the options based on the eslintConfig
 * @return {String} - the formatted string
 */
function format({
  text,
  filePath,
  disableLog = options.disableLog,
  eslintConfig = getConfig(filePath),
  prettierOptions = getPrettierOptionsFromESLintRules(eslintConfig),
}) {
  const originalLogValue = options.disableLog
  options.disableLog = disableLog

  try {
    const pretty = prettify(text, prettierOptions)
    return eslintFix(pretty, eslintConfig)
  } finally {
    options.disableLog = originalLogValue
  }
}

function prettify(text, formatOptions) {
  try {
    return prettier.format(text, formatOptions)
  } catch (error) {
    // is this noisy? Try setting options.disableLog to false
    logError('prettier formatting failed', error.stack)
    throw error
  }
}

function eslintFix(text, eslintConfig) {
  const eslintOptions = {
    ...eslintConfig,
    fix: true,
    // there's some trouble with `globals`...
    // I'm pretty sure it's not necessary to have them
    // for a --fix though so :shrug:
    globals: [],
  }
  const eslint = new CLIEngine(eslintOptions)
  try {
    const report = eslint.executeOnText(text)
    const [{output}] = report.results
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

function getConfig(filePath) {
  const eslintOptions = {}
  if (filePath) {
    eslintOptions.cwd = path.dirname(filePath)
  }
  const configFinder = new CLIEngine(eslintOptions)
  try {
    const config = configFinder.getConfigForFile(filePath)
    return config
  } catch (error) {
    // is this noisy? Try setting options.disableLog to false
    logError('Unable to find config', error.stack)
    throw error
  }
}

function logError(...args) {
  if (!options.disableLog) {
    console.error('prettier-eslint error:', ...args)
  }
}
