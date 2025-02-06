/* global process */

import { ESLint, Linter } from 'eslint';
import getLogger from 'loglevel-colored-level-prefix';
import {format as prettyFormat} from 'pretty-format';

import path from 'node:path';

import { mergeObjects } from '../merge-objects';

import { getESLint } from './get-eslint';
import { getESLintApiOptions } from './get-eslint-api-options';

const logger = getLogger({ prefix: 'prettier-eslint' });

/**
 * Retrieves the ESLint configuration for a given file.
 *
 * This function creates an ESLint instance and retrieves the configuration for the specified file.
 * If the configuration cannot be found, it returns a default ESLint configuration with empty rules.
 *
 * @param {string} filePath - The path of the file for which the ESLint configuration is retrieved.
 * @param {string} eslintPath - The path to the ESLint module.
 * @param {ESLint.Options} eslintOptions - Additional options for configuring ESLint.
 * @returns {Promise<ESLint.Options>} A promise that resolves to an array containing the ESLint configuration.
 *
 * @example
 * ```ts
 * const eslintConfig = await getESLintOptions('./example.js', '/path/to/eslint', { rules: { semi: ['error', 'always'] } });
 * console.log(eslintConfig);
 * ```
 */
export const getESLintOptions = async(
  filePath: string,
  eslintPath: string,
  eslintOptions: ESLint.Options
): Promise<ESLint.Options> => {
  if (filePath) {
    eslintOptions.cwd = path.dirname(filePath);
  }

  logger.trace(
    `Creating ESLint instance to get the config for "${filePath || process.cwd()}"`
  );

  const eslint = await getESLint(eslintPath, getESLintApiOptions(eslintOptions)) as unknown  as { calculateConfigForFile: (filePath: string) => Promise<Linter.Config>};

  try {
    logger.debug(`Getting ESLint config for file at "${filePath}"`);

    const config = await eslint.calculateConfigForFile(filePath);

    logger.trace(`ESLint config for "${filePath}" received`, prettyFormat(config));

    return {
      ...eslintOptions,
      baseConfig: {
        ...mergeObjects(eslintOptions.baseConfig as object|object[]),
        ...mergeObjects(config)
      }
    };
  /* eslint-disable @typescript-eslint/no-unused-vars */
  } catch (error) {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    // Log a debug message if ESLint configuration cannot be found
    logger.debug('Unable to find ESLint config');

    return {
      ...eslintOptions,
      baseConfig: [{ rules: {} }]
    };
  }
};

