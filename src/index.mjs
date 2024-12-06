/* eslint no-console:0, global-require:0, import/no-dynamic-require:0 */
/* eslint complexity: [1, 13] */

import fs from 'fs';
import path from 'node:path';
import requireRelative from 'require-relative';
import prettyFormat from 'pretty-format';
import { oneLine, stripIndent } from 'common-tags';
import indentString from 'indent-string';
import getLogger from 'loglevel-colored-level-prefix';
import merge from 'lodash.merge';
import { getESLint, getOptionsForFormatting, importModule } from './utils.mjs';

const logger = getLogger({ prefix: 'prettier-eslint' });

/**
 * Formats the text with prettier and then eslint based on the given options
 * @param {String} options.filePath - the path of the file being formatted
 *  can be used in lieu of `eslintConfig` (eslint will be used to find the
 *  relevant config for the file). Will also be used to load the `text` if
 *  `text` is not provided.
 * @param {String} options.text - the text (JavaScript code) to format
 * @param {String} options.eslintPath - the path to the eslint module to use.
 *   Will default to require.resolve('eslint')
 * @param {String} options.prettierPath - the path to the prettier module.
 *   Will default to require.resolve('prettier')
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
 * @return {Promise<String>} - the formatted string
 */
export async function format(options) {
  const { output } = await analyze(options);
  return output;
}

/**
 * Analyzes and formats text with prettier and eslint, based on the
 * identical options as for the `format` function. It differs from
 * `format` only in that the return value is a simple object with
 * properties `output` giving the formatted code and `messages` giving
 * any error messages generated in the analysis.
 * @param {Object} identical to options parameter of `format`
 * @returns {Promise<{ output: string; messages: string[] }>}
 *   The return value is an object `r` such that
 *  `r.output` is the formatted string and `r.messages` is an array of
 *  message specifications from eslint.
 */
// eslint-disable-next-line complexity
export async function analyze(options) {
  const { logLevel = getDefaultLogLevel() } = options;
  logger.setLevel(logLevel);
  logger.trace('called analyze with options:', prettyFormat(options));

  const {
    filePath,
    text = getTextFromFilePath(filePath),
    eslintPath = getModulePath(filePath, 'eslint'),
    prettierPath = getModulePath(filePath, 'prettier'),
    prettierLast,
    fallbackPrettierOptions,
  } = options;

  const eslintConfigFromFilePath = await getESLintConfig(
    filePath,
    eslintPath,
    options.eslintConfig || {},
  );

  const eslintConfig = merge(
    {},
    options.eslintConfig,
    eslintConfigFromFilePath,
  );

  const prettierConfigFromFilePath = await getPrettierConfig(
    filePath,
    prettierPath,
  );

  const prettierOptions = merge(
    {},
    // Let prettier infer the parser using the filepath, if present. Otherwise
    // assume the file is JS and default to the babel parser.
    filePath ? { filepath: filePath } : { parser: 'babel' },
    prettierConfigFromFilePath,
    options.prettierOptions,
  );

  const formattingOptions = getOptionsForFormatting(
    eslintConfig,
    prettierOptions,
    fallbackPrettierOptions,
    eslintPath,
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
      prettierLast,
    }),
  );

  const eslintExtensions = eslintConfig.extensions || [
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.mjs',
    '.vue',
    '.svelte',
  ];
  const fileExtension = path.extname(filePath || '');

  // If we don't get filePath, run eslint on text, otherwise only run eslint
  // if it's a configured extension or fall back to a "supported" file type.
  const onlyPrettier = filePath
    ? !eslintExtensions.includes(fileExtension)
    : false;

  const prettify = createPrettify(formattingOptions.prettier, prettierPath);

  if (onlyPrettier) {
    return prettify(text);
  }

  formattingOptions.eslint.parser =
    formattingOptions.eslint.parser ??
    (['.ts', '.tsx'].includes(fileExtension)
      ? require.resolve('@typescript-eslint/parser')
      : undefined) ??
    (['.vue'].includes(fileExtension)
      ? require.resolve('vue-eslint-parser')
      : undefined) ??
    (['.svelte'].includes(fileExtension)
      ? require.resolve('svelte-eslint-parser')
      : undefined);

  const eslintFix = await createEslintFix(formattingOptions.eslint, eslintPath);

  if (prettierLast) {
    const eslintFixed = await eslintFix(text, filePath);
    return prettify(eslintFixed);
  }

  return eslintFix((await prettify(text)).output, filePath);
}

function createPrettify(formatOptions, prettierPath) {
  return async function prettify(param) {
    let text = param;
    let messages = [];
    if (typeof param !== 'string') {
      text = param.output;
      messages = param.text;
    }
    logger.debug('calling prettier on text');
    logger.trace(
      stripIndent`
      prettier input:

      ${indentString(text, 2)}
    `,
    );
    const Prettier = await importModule(prettierPath, 'prettier');
    try {
      logger.trace('calling prettier.format with the text and prettierOptions');
      const output = await Prettier.format(text, formatOptions);
      logger.trace('prettier: output === input', output === text);
      logger.trace(
        stripIndent`
        prettier output:

        ${indentString(output, 2)}
      `,
      );
      return { output, messages };
    } catch (error) {
      logger.error('prettier formatting failed due to a prettier error');
      throw error;
    }
  };
}

function createEslintFix(eslintConfig, eslintPath) {
  return async function eslintFix(text, filePath) {
    if (Array.isArray(eslintConfig.globals)) {
      const tempGlobals = {};
      eslintConfig.globals.forEach(g => {
        const [key, value] = g.split(':');
        tempGlobals[key] = value;
      });
      eslintConfig.globals = tempGlobals;
    }

    // Pluck values from base configuration and apply to overrideConfig
    const {
      env,
      globals,
      ignorePatterns,
      ignorePattern,
      noInlineConfig,
      parser,
      parserOptions,
      plugins,
      rules,
      settings,
      ...rest
    } = eslintConfig;

    const nextEslintConfig = {
      ...rest,
      overrideConfig: {
        env,
        globals,
        ignorePatterns: ignorePatterns ?? ignorePattern,
        noInlineConfig,
        parser,
        parserOptions,
        plugins,
        rules,
        settings,
        ...eslintConfig.overrideConfig,
      },
    };

    const eslint = await getESLint(eslintPath, nextEslintConfig);

    try {
      logger.trace('calling cliEngine.executeOnText with the text');
      // console.dir({ eslint });
      const report = await eslint.lintText(text, {
        filePath,
        warnIgnored: true,
      });
      logger.trace(
        'executeOnText returned the following report:',
        prettyFormat(report),
      );
      // default the output to text because if there's nothing
      // to fix, eslint doesn't provide `output`
      const [{ output = text, messages }] = await report;
      logger.trace('eslint --fix: output === input', output === text);
      // NOTE: We're ignoring linting errors/warnings here and
      // defaulting to the given text if there are any
      // because all we're trying to do is fix what we can.
      // We don't care about what we can't
      logger.trace(
        stripIndent`
        eslint --fix output:

        ${indentString(output, 2)}
      `,
      );
      return { output, messages };
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
      `,
    );
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    logger.error(
      oneLine`
        failed to get the text to format
        from the given filePath: "${filePath}"
      `,
    );
    throw error;
  }
}

function getESLintApiOptions(eslintConfig) {
  // https://eslint.org/docs/developer-guide/nodejs-api
  // these options affect what calculateConfigForFile produces
  return {
    ignore: eslintConfig.ignore || true,
    ignorePath: eslintConfig.ignorePath || null,
    allowInlineConfig: eslintConfig.allowInlineConfig || true,
    baseConfig: eslintConfig.baseConfig || null,
    overrideConfig: eslintConfig.overrideConfig || null,
    overrideConfigFile: eslintConfig.overrideConfigFile || null,
    plugins: eslintConfig.plugins || null,
    resolvePluginsRelativeTo: eslintConfig.resolvePluginsRelativeTo || null,
    rulePaths: eslintConfig.rulePaths || [],
    useEslintrc: eslintConfig.useEslintrc || true,
  };
}

async function getESLintConfig(filePath, eslintPath, eslintOptions) {
  if (filePath) {
    eslintOptions.cwd = path.dirname(filePath);
  }
  logger.trace(
    oneLine`
      creating ESLint CLI Engine to get the config for
      "${filePath || process.cwd()}"
    `,
  );
  const eslint = await getESLint(
    eslintPath,
    getESLintApiOptions(eslintOptions),
  );

  try {
    logger.debug(`getting eslint config for file at "${filePath}"`);
    const config = await eslint.calculateConfigForFile(filePath);

    logger.trace(
      `eslint config for "${filePath}" received`,
      prettyFormat(config),
    );

    return {
      ...eslintOptions,
      ...config,
    };
  } catch (error) {
    // is this noisy? Try setting options.disableLog to false
    logger.debug('Unable to find config');
    return { rules: {} };
  }
}

async function getPrettierConfig(filePath, prettierPath) {
  const prettier = await importModule(prettierPath, 'prettier');
  return prettier.resolveConfig && prettier.resolveConfig(filePath);
}

function getModulePath(filePath, moduleName) {
  try {
    return requireRelative.resolve(moduleName, filePath);
  } catch (error) {
    logger.debug(
      oneLine`
        There was a problem finding the ${moduleName}
        module. Using prettier-eslint's version.
      `,
      error.message,
      error.stack,
    );
    return require.resolve(moduleName);
  }
}

function getDefaultLogLevel() {
  return process.env.LOG_LEVEL || 'warn';
}
