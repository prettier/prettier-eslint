import typescriptParser from '@typescript-eslint/parser';
import { Linter } from 'eslint';
import getLogger from 'loglevel-colored-level-prefix';
import { format as prettyFormat} from 'pretty-format'; // ES2015 modules
import svelteParser from 'svelte-eslint-parser';
import vueParser from 'vue-eslint-parser';

import path from 'node:path';

import { FormatOptions } from './types.js';
import { deepMerge } from './utils/deep-merge.js';
import { createEslintFix } from './utils/eslint/create-eslint-fix.js';
import { getConfigPropertyFromESLintOptions } from './utils/eslint/get-config-property-from-eslint-options.js';
import { getESLintOptions } from './utils/eslint/get-eslint-options.js';
import { setLanguageOptionsIntoESLintOptions } from './utils/eslint/set-language-options-into-eslint-options.js';
import { extractFileExtensions } from './utils/extract-file-extensions.js';
import { getDefaultLogLevel } from './utils/get-default-log-level.js';
import { getModulePath } from './utils/get-module-path.js';
import { getOptionsForFormatting } from './utils/get-options-for-formatting.js';
import { getTextFromFilePath } from './utils/get-text-from-file-path.js';
import { createPrettify } from './utils/prettier/create-prettify.js';
import { getPrettierConfig } from './utils/prettier/get-prettier-config.js';

const logger = getLogger({ prefix: 'prettier-eslint' });

/**
 * Formats JavaScript code using Prettier and then ESLint based on the provided options.
 *
 * This function first analyzes the code using ESLint and Prettier, then returns the formatted output.
 *
 * @param {FormatOptions} options - The configuration options for formatting.
 * @returns {Promise<string>} A promise that resolves with the formatted code.
 *
 * @example
 * ```ts
 * const formattedCode = await format({ filePath: './example.js', text: 'const x=1;' });
 * console.log(formattedCode); // Output: 'const x = 1;'
 * ```
 */
export const format = async (options: FormatOptions): Promise<string> => {
  const { output } = await analyze(options);

  return output;
};

/**
 * Analyzes and formats text using Prettier and ESLint.
 *
 * This function applies Prettier and ESLint formatting based on the provided options.
 * It first retrieves configuration settings from the given file path and modules,
 * then formats the code accordingly. The function ensures proper ordering of Prettier
 * and ESLint operations based on the `prettierLast` flag.
 *
 * @param {FormatOptions} options - The configuration options for formatting.
 * @returns {Promise<{ output: string; messages: Linter.LintMessage[] }>}
 *          A promise resolving to an object containing formatted output and ESLint messages.
 *
 * @example
 * ```ts
 * const formatted = await analyze({ filePath: './example.js', text: 'const x=1;' });
 * console.log(formatted.output); // Formatted code
 * ```
 */
export const analyze = async (options: FormatOptions): Promise<{ output: string; messages: Linter.LintMessage[] }> => {
  // Set the log level
  const { logLevel = getDefaultLogLevel() } = options;

  logger.setLevel(logLevel);
  logger.trace('Called analyze with options:', prettyFormat(options));

  // Extract necessary options and determine file paths
  const {
    filePath,
    text = getTextFromFilePath(filePath || ''),
    eslintPath = getModulePath(filePath || '', 'eslint'),
    prettierPath = getModulePath(filePath || '', 'prettier'),
    prettierLast,
    fallbackPrettierOptions
  } = options;
  // Retrieve ESLint options
  const eslintOptionsFromFilePath = await getESLintOptions(filePath || '', eslintPath, options.eslintOptions || {});

  logger.debug('ESLint options retrieved:', prettyFormat(eslintOptionsFromFilePath));

  // Merge provided ESLint options with retrieved options
  const eslintOptions = {
    ...options.eslintOptions,
    ...eslintOptionsFromFilePath
  };
  // Retrieve Prettier configuration
  const prettierConfigFromFilePath = await getPrettierConfig(filePath || '', prettierPath);

  logger.debug('Prettier config retrieved:', prettyFormat(prettierConfigFromFilePath));

  // Merge provided Prettier options with retrieved configuration
  const prettierOptions = deepMerge(
    {},
    filePath ? { filepath: filePath } : { parser: 'babel' },
    prettierConfigFromFilePath|| {},
    options.prettierOptions || {}
  ) as Record<string, unknown>;
  // Prepare final formatting options
  const formattingOptions = getOptionsForFormatting(eslintOptions, prettierOptions, fallbackPrettierOptions);

  logger.debug('Final formatting options:', prettyFormat(formattingOptions));

  // Determine file extension and ESLint applicability
  const eslintFiles =( getConfigPropertyFromESLintOptions(eslintOptions, 'files') || ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.mjs', '**/*.vue', '**/*.svelte']) as string[];
  const extensions = extractFileExtensions(eslintFiles);
  const fileExtension = path.extname(filePath || '');
  const onlyPrettier = filePath ? !extensions.includes(fileExtension) : false;
  // Initialize Prettier formatter
  const prettify = createPrettify(formattingOptions.prettier, prettierPath);

  if (onlyPrettier) {
    return prettify(text);
  }

  // Ensure correct parser settings based on file type
  if(['.ts', '.tsx'].includes(fileExtension)){
    setLanguageOptionsIntoESLintOptions(formattingOptions.eslint,'parser', typescriptParser);
  }

  if(['.vue'].includes(fileExtension)){
    setLanguageOptionsIntoESLintOptions(formattingOptions.eslint,'parser', vueParser);
  }

  if(['.svelte'].includes(fileExtension)){
    setLanguageOptionsIntoESLintOptions(formattingOptions.eslint,'parser', svelteParser);
  }

  // Initialize ESLint fixer
  const eslintFix = createEslintFix(formattingOptions.eslint, eslintPath);

  // Determine the order of Prettier and ESLint operations
  if (prettierLast) {
    const eslintFixed = await eslintFix(text, filePath || undefined);

    return prettify(eslintFixed.output);
  }

  return eslintFix((await prettify(text)).output, filePath || undefined);
};








