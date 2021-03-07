/* eslint no-console:0, global-require:0, import/no-dynamic-require:0 */
/* eslint complexity: [1, 13] */

// Add node 8 polyfills, to be removed if we decide to let go node 8 support
import 'core-js/modules/es.string.trim-start'; // eslint-disable-line 
import 'core-js/modules/es.string.trim-end'; // eslint-disable-line 

import fs from 'fs';
import path from 'path';
import requireRelative from 'require-relative';
import prettyFormat from 'pretty-format';
import { oneLine, stripIndent } from 'common-tags';
import indentString from 'indent-string';
import getLogger from 'loglevel-colored-level-prefix';
import merge from 'lodash.merge';
import {
  getESLintCLIEngine,
  getOptionsForFormatting,
  requireModule
} from './utils';

const logger = getLogger({ prefix: 'prettier-eslint' });

// CommonJS + ES6 modules... is it worth it? Probably not...
module.exports = format;

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
 *   Will default to require.resovlve('prettier')
 * @param {Object} options.eslintConfig - the config to use for formatting
 *  with ESLint.
 * @param {Object} options.prettierOptions - the options to pass for
 *  formatting with `prettier`. If not provided, prettier-eslint will attempt
 *  to create the options based on the eslintConfig
 * @param {Object} options.fallbackPrettierOptions - the options to pass for
 *  formatting with `prettier` if the given option is not inferrable from the
 *  eslintConfig.
 * @param {String} options.logLevel - the level for the logs
 *  (error, warn, info, debug, trace)
 * @param {Boolean} options.prettierLast - Run Prettier Last
 * @return {String} - the formatted string
 */
function format(options) {
  const { logLevel = getDefaultLogLevel() } = options;
  logger.setLevel(logLevel);
  logger.trace('called format with options:', prettyFormat(options));

  const {
    filePath,
    text = getTextFromFilePath(filePath),
    eslintPath = getModulePath(filePath, 'eslint'),
    prettierPath = getModulePath(filePath, 'prettier'),
    prettierLast,
    fallbackPrettierOptions
  } = options;

  const eslintConfig = merge(
    {},
    options.eslintConfig,
    getESLintConfig(filePath, eslintPath)
  );

  if (typeof eslintConfig.globals === 'object') {
    eslintConfig.globals = Object.entries(eslintConfig.globals).map(
      ([key, value]) => `${key}:${value}`
    );
  }

  const prettierOptions = merge(
    {},
    filePath && { filepath: filePath },
    getPrettierConfig(filePath, prettierPath),
    options.prettierOptions
  );

  const formattingOptions = getOptionsForFormatting(
    eslintConfig,
    prettierOptions,
    fallbackPrettierOptions,
    eslintPath
  );

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
      prettierLast
    })
  );

  const eslintExtensions = eslintConfig.extensions || [
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.mjs',
    '.vue'
  ];
  const fileExtension = path.extname(filePath || '');

  // If we don't get filePath run eslint on text, otherwise only run eslint
  // if it's a configured extension or fall back to a "supported" file type.
  const onlyPrettier = filePath
    ? !eslintExtensions.includes(fileExtension)
    : false;

  const prettify = createPrettify(formattingOptions.prettier, prettierPath);

  if (onlyPrettier) {
    return prettify(text);
  }

  if (['.ts', '.tsx'].includes(fileExtension)) {
    formattingOptions.eslint.parser =
      formattingOptions.eslint.parser ||
      require.resolve('@typescript-eslint/parser');
  }

  if (['.vue'].includes(fileExtension)) {
    formattingOptions.eslint.parser =
      formattingOptions.eslint.parser || require.resolve('vue-eslint-parser');
  }

  const eslintFix = createEslintFix(formattingOptions.eslint, eslintPath);

  if (prettierLast) {
    return prettify(eslintFix(text, filePath));
  }
  return eslintFix(prettify(text), filePath);
}

function createPrettify(formatOptions, prettierPath) {
  return function prettify(text) {
    logger.debug('calling prettier on text');
    logger.trace(
      stripIndent`
      prettier input:

      ${indentString(text, 2)}
    `
    );
    const prettier = requireModule(prettierPath, 'prettier');
    try {
      logger.trace(`calling prettier.format with the text and prettierOptions`);
      const output = prettier.format(text, formatOptions);
      logger.trace('prettier: output === input', output === text);
      logger.trace(
        stripIndent`
        prettier output:

        ${indentString(output, 2)}
      `
      );
      return output;
    } catch (error) {
      logger.error('prettier formatting failed due to a prettier error');
      throw error;
    }
  };
}

function createEslintFix(eslintConfig, eslintPath) {
  return function eslintFix(text, filePath) {
    const cliEngine = getESLintCLIEngine(eslintPath, eslintConfig);
    try {
      logger.trace(`calling cliEngine.executeOnText with the text`);
      const report = cliEngine.executeOnText(text, filePath, true);
      logger.trace(
        `executeOnText returned the following report:`,
        prettyFormat(report)
      );
      // default the output to text because if there's nothing
      // to fix, eslint doesn't provide `output`
      const [{ output = text }] = report.results;
      logger.trace('eslint --fix: output === input', output === text);
      // NOTE: We're ignoring linting errors/warnings here and
      // defaulting to the given text if there are any
      // because all we're trying to do is fix what we can.
      // We don't care about what we can't
      logger.trace(
        stripIndent`
        eslint --fix output:

        ${indentString(output, 2)}
      `
      );
      return output;
    } catch (error) {
      logger.error('eslint fix failed due to an eslint error');
      throw error;
    }
  };
}

function getTextFromFilePath(filePath) {
  try {
    logger.trace(
      oneLine`
        attempting fs.readFileSync to get
        the text for file at "${filePath}"
      `
    );
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    logger.error(
      oneLine`
        failed to get the text to format
        from the given filePath: "${filePath}"
      `
    );
    throw error;
  }
}

function getESLintConfig(filePath, eslintPath) {
  const eslintOptions = {};
  if (filePath) {
    eslintOptions.cwd = path.dirname(filePath);
  }
  logger.trace(
    oneLine`
      creating ESLint CLI Engine to get the config for
      "${filePath || process.cwd()}"
    `
  );
  const cliEngine = getESLintCLIEngine(eslintPath, eslintOptions);
  try {
    logger.debug(`getting eslint config for file at "${filePath}"`);
    const config = cliEngine.getConfigForFile(filePath);
    logger.trace(
      `eslint config for "${filePath}" received`,
      prettyFormat(config)
    );
    return {
      ...eslintOptions,
      ...config
    };
  } catch (error) {
    // is this noisy? Try setting options.disableLog to false
    logger.debug('Unable to find config');
    return { rules: {} };
  }
}

function getPrettierConfig(filePath, prettierPath) {
  const prettier = requireModule(prettierPath, 'prettier');
  return (
    (prettier.resolveConfig &&
      prettier.resolveConfig.sync &&
      prettier.resolveConfig.sync(filePath, { editorconfig: true })) ||
    {}
  );
}

function getModulePath(filePath = __filename, moduleName) {
  try {
    return requireRelative.resolve(moduleName, filePath);
  } catch (error) {
    logger.debug(
      oneLine`
        There was a problem finding the ${moduleName}
        module. Using prettier-eslint's version.
      `,
      error.message,
      error.stack
    );
    return require.resolve(moduleName);
  }
}

function getDefaultLogLevel() {
  return process.env.LOG_LEVEL || 'warn';
}
