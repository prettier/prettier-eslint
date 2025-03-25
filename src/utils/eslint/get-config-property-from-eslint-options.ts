import { ESLint, Linter } from 'eslint';
import getLogger from 'loglevel-colored-level-prefix';

import { mergeObjects } from '../merge-objects';

const logger = getLogger({ prefix: 'prettier-eslint' });

/**
 * Retrieves a specific property from the merged ESLint configuration.
 *
 * This function extracts a specified property from `eslintOptions.baseConfig`, merging multiple configurations
 * if necessary. If the property is not found, it logs an error and throws an exception.
 *
 * @param {ESLint.Options} eslintOptions - The ESLint options object.
 * @param {keyof Linter.Config} property - The configuration property to retrieve.
 * @returns {unknown} The value of the specified property from the merged ESLint configuration.
 * @throws {Error} If required parameters are missing or if the property is not found.
 *
 * @example
 * ```ts
 * const eslintOptions: ESLint.Options = { baseConfig: { rules: { semi: ['error', 'always'] } } };
 * console.log(getConfigPropertyFromESLintOptions(eslintOptions, 'rules')); // Output: { semi: ['error', 'always'] }
 * ```
 */
export const getConfigPropertyFromESLintOptions = (
  eslintOptions: ESLint.Options,
  property: keyof Linter.Config
): unknown => {
  if (!eslintOptions || !property || typeof property !== 'string') {
    throw new Error('Missing or invalid parameters for getConfigPropertyFromESLintOptions');
  }

  const { baseConfig } = eslintOptions;
  const preparedConfig = mergeObjects(baseConfig as object | object[]) as Linter.Config;

  try {
    return preparedConfig[property];
  } catch (error) {
    logger.error(`No matching property "${property}" found in config`);
    throw error;
  }
};
