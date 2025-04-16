import fs from 'node:fs';
import path from 'node:path';

import { oneLine, stripIndent } from 'common-tags';
import type { Linter } from 'eslint';
import indentString from 'indent-string';
import merge from 'lodash.merge';
import getLogger from 'loglevel-colored-level-prefix';
import { format as prettyFormat } from 'pretty-format';
import requireRelative from 'require-relative';

import type {
  ESLintConfig,
  PrettifyInput,
  FormatOptions,
  LogLevel,
  PrettierOptions,
  ESLintConfigGlobalValue,
} from './types.ts';
import { getESLint, getOptionsForFormatting, requireModule } from './utils.ts';

const logger = getLogger({ prefix: 'prettier-eslint' });

/**
 * Formats the text with Prettier and then ESLint while obeying the user's
 * configuration.
 *
 * @returns The formatted string
 */
export async function format(options: FormatOptions): Promise<string> {
  const { output } = await analyze(options);
  return output;
}

/**
 * Analyzes and formats text with prettier and eslint, based on the identical
 * options as for the `format` function. It differs from `format` only in that
 * the return value is a simple object with properties `output` giving the
 * formatted code and `messages` giving any error messages generated in the
 * analysis.
 *
 * @param options To options parameter of `format`
 * @returns The return value is an object `r` such that `r.output` is the
 *   formatted string and `r.messages` is an array of message specifications
 *   from eslint.
 */
// eslint-disable-next-line complexity
export async function analyze(options: FormatOptions): Promise<{
  output: string;
  messages: Linter.LintMessage[];
}> {
  const { logLevel = getDefaultLogLevel() } = options;
  logger.setLevel(logLevel);
  logger.trace('called analyze with options:', prettyFormat(options));

  const {
    filePath,
    text = getTextFromFilePath(filePath!), // `filePath` must be provided if `text` is not
    eslintPath = getModulePath(filePath, 'eslint'),
    prettierPath = getModulePath(filePath, 'prettier'),
    prettierLast,
    fallbackPrettierOptions,
  } = options;

  const eslintConfig = merge(
    {},
    options.eslintConfig,
    await getESLintConfig(filePath, eslintPath, options.eslintConfig || {}),
  );

  const prettierOptions: PrettierOptions = merge(
    {},
    // Let prettier infer the parser using the filepath, if present. Otherwise
    // assume the file is JS and default to the babel parser.
    filePath ? { filepath: filePath } : { parser: 'babel' },
    await getPrettierConfig(filePath, prettierPath),
    options.prettierOptions,
  );

  const formattingOptions = getOptionsForFormatting(
    eslintConfig,
    prettierOptions,
    fallbackPrettierOptions,
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
    '.cjs',
    '.cts',
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.mjs',
    '.mts',
    '.vue',
    '.svelte',
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
    formattingOptions.eslint.parser ||= require.resolve(
      '@typescript-eslint/parser',
    );
  }

  if (['.vue'].includes(fileExtension)) {
    formattingOptions.eslint.parser ||= require.resolve('vue-eslint-parser');
  }

  if (['.svelte'].includes(fileExtension)) {
    formattingOptions.eslint.parser ||= require.resolve('svelte-eslint-parser');
  }

  const eslintFix = createEslintFix(formattingOptions.eslint, eslintPath);

  if (prettierLast) {
    const eslintFixed = await eslintFix(text, filePath);
    return prettify(eslintFixed);
  }

  const { output } = await prettify(text);

  return eslintFix(output, filePath);
}

/**
 * Creates a function that formats text using Prettier.
 *
 * This function initializes Prettier and formats the given text according to
 * the specified formatting options.
 *
 * @example
 *   const prettify = createPrettify(
 *     { semi: false, singleQuote: true },
 *     '/path/to/prettier',
 *   );
 *   const result = await prettify('const x=1;');
 *   console.log(result.output); // Formatted code
 *
 * @param formatOptions - The options to pass to Prettier.
 * @param prettierPath - The path to the Prettier module.
 * @returns A function that formats text using Prettier.
 */
function createPrettify(formatOptions: PrettierOptions, prettierPath: string) {
  return async function prettify(
    param: PrettifyInput | string,
  ): Promise<{ output: string; messages: Linter.LintMessage[] }> {
    let text = param;
    let messages: Linter.LintMessage[] = [];
    if (typeof text !== 'string') {
      messages = text.messages;
      text = text.output;
    }
    logger.debug('calling prettier on text');
    logger.trace(
      stripIndent`
      prettier input:

      ${indentString(text, 2)}
    `,
    );
    const prettier = requireModule<typeof import('prettier')>(
      prettierPath,
      'prettier',
    );
    try {
      logger.trace('calling prettier.format with the text and prettierOptions');
      const output = await prettier.format(text, formatOptions);
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

function createEslintFix(eslintConfig: ESLintConfig, eslintPath: string) {
  return async function eslintFix(text: string, filePath?: string) {
    if (Array.isArray(eslintConfig.globals)) {
      const tempGlobals: Linter.BaseConfig['globals'] = {};
      for (const g of eslintConfig.globals as string[]) {
        const [key, value] = g.split(':');
        tempGlobals[key] = value as ESLintConfigGlobalValue;
      }
      eslintConfig.globals = tempGlobals;
    }

    eslintConfig.overrideConfig = {
      rules: eslintConfig.rules,
      parser: eslintConfig.parser,
      globals: eslintConfig.globals,
      parserOptions: eslintConfig.parserOptions,
      ignorePatterns: eslintConfig.ignorePatterns || eslintConfig.ignorePattern,
      plugins: eslintConfig.plugins,
      env: eslintConfig.env,
      settings: eslintConfig.settings,
      noInlineConfig: eslintConfig.noInlineConfig,
      ...eslintConfig.overrideConfig,
    };

    delete eslintConfig.rules;
    delete eslintConfig.parser;
    delete eslintConfig.parserOptions;
    delete eslintConfig.globals;
    delete eslintConfig.ignorePatterns;
    delete eslintConfig.ignorePattern;
    delete eslintConfig.plugins;
    delete eslintConfig.env;
    delete eslintConfig.noInlineConfig;
    delete eslintConfig.settings;

    const eslint = getESLint(eslintPath, eslintConfig);
    try {
      logger.trace('calling cliEngine.executeOnText with the text');
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
      const [{ output = text, messages }] = report;
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

function getTextFromFilePath(filePath: string) {
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

/**
 * Generates ESLint API options based on the provided ESLint options.
 *
 * This function constructs an object with properties that affect how ESLint's
 * `calculateConfigForFile` function behaves. It ensures default values are
 * assigned if properties are not explicitly provided.
 *
 * @example
 *   const eslintOptions = getESLintApiOptions({
 *     ignore: false,
 *     plugins: ['react'],
 *   });
 *   console.log(eslintOptions);
 *   // Output: {
 *   //   ignore: false,
 *   //   allowInlineConfig: true,
 *   //   baseConfig: null,
 *   //   overrideConfig: null,
 *   //   overrideConfigFile: null,
 *   //   plugins: ['react']
 *   // }
 *
 * @param eslintConfig - The ESLint options.
 * @returns An object containing options for the ESLint API.
 */
function getESLintApiOptions(eslintConfig: ESLintConfig): ESLintConfig {
  // https://eslint.org/docs/developer-guide/nodejs-api
  // these options affect what calculateConfigForFile produces
  return {
    ignore: eslintConfig.ignore || true,
    ignorePath: eslintConfig.ignorePath,
    allowInlineConfig: eslintConfig.allowInlineConfig || true,
    baseConfig: eslintConfig.baseConfig,
    overrideConfig: eslintConfig.overrideConfig,
    overrideConfigFile: eslintConfig.overrideConfigFile,
    plugins: eslintConfig.plugins,
    resolvePluginsRelativeTo: eslintConfig.resolvePluginsRelativeTo,
    rulePaths: eslintConfig.rulePaths || [],
    useEslintrc: eslintConfig.useEslintrc || true,
  };
}

async function getESLintConfig(
  filePath: string | undefined,
  eslintPath: string,
  eslintConfig: ESLintConfig,
): Promise<ESLintConfig> {
  if (filePath) {
    eslintConfig.cwd = path.dirname(filePath);
  }
  logger.trace(
    oneLine`
      creating ESLint CLI Engine to get the config for
      "${filePath || process.cwd()}"
    `,
  );
  const eslint = getESLint(eslintPath, getESLintApiOptions(eslintConfig));

  try {
    logger.debug(`getting eslint config for file at "${filePath}"`);
    const config = (await eslint.calculateConfigForFile(
      filePath!, // `undefined` is actually fine
    )) as ESLintConfig;
    logger.trace(
      `eslint config for "${filePath}" received`,
      prettyFormat(config),
    );
    return {
      ...eslintConfig,
      ...config,
    };
  } catch {
    // is this noisy? Try setting options.disableLog to false
    logger.debug('Unable to find config');
    return { rules: {} };
  }
}

function getPrettierConfig(filePath: string | undefined, prettierPath: string) {
  const prettier = requireModule<typeof import('prettier')>(
    prettierPath,
    'prettier',
  );
  return prettier.resolveConfig(filePath!); // `undefined` is actually fine
}

/**
 * Resolves the absolute path to a module relative to a given file path.
 *
 * This function attempts to resolve a module's path relative to the provided
 * `filePath`. If the module cannot be found in the specified location, it falls
 * back to resolving the module globally using `require.resolve`.
 *
 * @example
 *   const eslintPath = getModulePath('./example.js', 'eslint');
 *   console.log(eslintPath); // Output: Absolute path to the ESLint module
 *
 * @param filePath - The file path from which to resolve the module.
 * @param moduleName - The name of the module to resolve.
 * @returns The resolved module path.
 */
function getModulePath(filePath = __filename, moduleName: string) {
  try {
    return requireRelative.resolve(moduleName, filePath);
  } catch (err) {
    const error = err as Error;
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
  return (process.env.LOG_LEVEL as LogLevel | undefined) || 'warn';
}

export type * from './types.js';
export * from './utils.ts';

export default { format, analyze };
