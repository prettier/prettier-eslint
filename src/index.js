/* eslint no-console:0, global-require:0, import/no-dynamic-require:0 */
import fs from 'fs'
import path from 'path'
import requireRelative from 'require-relative'
import prettyFormat from 'pretty-format'
import {oneLine, stripIndent} from 'common-tags'
import indentString from 'indent-string'
import {getOptionsForFormatting} from './utils'
import getLogger from './log'

const defaultLogLevel = process.env.LOG_LEVEL || 'WARN'
const logger = getLogger(defaultLogLevel)

// CommonJS + ES6 modules... is it worth it? Probably not...
module.exports = format

/**
 * Formats the text with prettier and then eslint based on the given options
 * @param {String} options.filePath - the path of the file being formatted
 *  can be used in leu of `eslintConfig` (eslint will be used to find the
 *  relevant config for the file). Will also be used to load the `text` if
 *  `text` is not provided.
 * @param {String} options.text - the text (JavaScript code) to format
 * @param {String} options.eslintPath - the path to the eslint module to use.
 *   Will default to require.resolve('eslint')
 * @param {String} options.prettierPath - the path to the prettier module.
 *   Will default to require.resovlve('prettierPath')
 * @param {String} options.eslintConfig - the config to use for formatting
 *  with ESLint.
 * @param {Object} options.prettierOptions - the options to pass for
 *  formatting with `prettier`. If not provided, prettier-eslint will attempt
 *  to create the options based on the eslintConfig
 * @param {Boolean} options.logLevel - the level for the logs
 *  (error, warn, info, debug, trace)
 * @return {String} - the formatted string
 */
function format(options) {
  try {
    const {logLevel = defaultLogLevel} = options
    logger.setLevel(logLevel)
    logger.trace('called format with options:', prettyFormat(options))

    const {
      filePath,
      text = getTextFromFilePath(filePath),
      eslintPath = getModulePath(filePath, 'eslint'),
      prettierPath = getModulePath(filePath, 'prettier'),
      eslintConfig = getConfig(filePath, eslintPath),
      prettierOptions,
    } = options
    const formattingOptions = getOptionsForFormatting(
      eslintConfig,
      prettierOptions,
    )
    logger.debug(
      'inferred options:',
      prettyFormat({
        filePath,
        text,
        eslintPath,
        prettierPath,
        eslintConfig: formattingOptions.eslint,
        prettierOptions: formattingOptions.prettier,
        logLevel,
      }),
    )

    logger.debug('calling prettier on text')
    logger.trace(
      stripIndent`
        prettier input:

        ${indentString(text, 2)}
      `,
    )
    const pretty = prettify(text, formattingOptions.prettier, prettierPath)
    logger.trace(
      stripIndent`
        prettier output (eslint input):

        ${indentString(pretty, 2)}
      `,
    )
    const eslintFixed = eslintFix(pretty, formattingOptions.eslint, eslintPath)
    logger.trace(
      stripIndent`
        eslint --fix output (final formatted result):

        ${indentString(pretty, 2)}
      `,
    )
    return eslintFixed
  } finally {
    logger.setLevel(defaultLogLevel)
  }
}

function prettify(text, formatOptions, prettierPath) {
  let prettier
  try {
    logger.trace(`requiring prettier module at "${prettierPath}"`)
    prettier = require(prettierPath)
  } catch (error) {
    logger.error(
      oneLine`
        There was trouble getting prettier.
        Is "prettierPath: ${prettierPath}"
        a correct path to the prettier module?
      `,
    )
    throw error
  }
  try {
    logger.trace(`calling prettier.format with the text and prettierOptions`)
    const output = prettier.format(text, formatOptions)
    logger.trace('prettier: output === input', output === text)
    return output
  } catch (error) {
    logger.error('prettier formatting failed due to a prettier error')
    throw error
  }
}

function eslintFix(text, eslintConfig, eslintPath) {
  const eslint = getESLintCLIEngine(eslintPath, eslintConfig)
  try {
    logger.trace(`calling eslint.executeOnText with the text`)
    const report = eslint.executeOnText(text)
    logger.trace(
      `executeOnText returned the following report:`,
      prettyFormat(report),
    )
    // default the output to text because if there's nothing
    // to fix, eslint doesn't provide `output`
    const [{output = text}] = report.results
    logger.trace('eslint --fix: output === input', output === text)
    // NOTE: We're ignoring linting errors/warnings here and
    // defaulting to the given text if there are any
    // because all we're trying to do is fix what we can.
    // We don't care about what we can't
    return output
  } catch (error) {
    logger.error('eslint fix failed due to an eslint error')
    throw error
  }
}

function getTextFromFilePath(filePath) {
  try {
    logger.trace(
      oneLine`
        attempting fs.readFileSync to get
        the text for file at "${filePath}"
      `,
    )
    return fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    logger.error(
      oneLine`
        failed to get the text to format
        from the given filePath: "${filePath}"
      `,
    )
    throw error
  }
}

function getConfig(filePath, eslintPath) {
  const eslintOptions = {}
  if (filePath) {
    eslintOptions.cwd = path.dirname(filePath)
  }
  logger.trace(
    oneLine`
      creating ESLint CLI Engine to get the config for
      "${filePath || process.cwd()}"
    `,
  )
  const configFinder = getESLintCLIEngine(eslintPath, eslintOptions)
  try {
    logger.debug(`getting eslint config for file at "${filePath}"`)
    const config = configFinder.getConfigForFile(filePath)
    logger.trace(
      `eslint config for "${filePath}" received`,
      prettyFormat(config),
    )
    return config
  } catch (error) {
    // is this noisy? Try setting options.disableLog to false
    logger.error('Unable to find config')
    throw error
  }
}

function getModulePath(filePath = __filename, moduleName) {
  try {
    return requireRelative.resolve(moduleName, filePath)
  } catch (error) {
    logger.debug(
      oneLine`
        There was a problem finding the ${moduleName}
        module. Using prettier-eslint's version.
      `,
      error.message,
      error.stack,
    )
    return require.resolve(moduleName)
  }
}

function getESLintCLIEngine(eslintPath, eslintOptions) {
  try {
    logger.trace(`requiring eslint module at "${eslintPath}"`)
    const {CLIEngine} = require(eslintPath)
    return new CLIEngine(eslintOptions)
  } catch (error) {
    logger.error(
      oneLine`
        There was trouble creating the ESLint CLIEngine.
        Is "eslintPath: ${eslintPath}" a correct path to the ESLint module?
      `,
    )
    throw error
  }
}
