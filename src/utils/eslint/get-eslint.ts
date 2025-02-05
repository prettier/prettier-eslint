import getLogger from 'loglevel-colored-level-prefix';
import { importModule } from '../import-module';
import { ESLint } from 'eslint';
import { ESLintModule } from '../../types';
const logger = getLogger({ prefix: 'prettier-eslint' });
/**
 * Dynamically imports ESLint and initializes an ESLint instance with the provided options.
 *
 * This function imports the ESLint module dynamically from the specified path and creates an instance
 * using the given configuration options. If the initialization fails, an error is logged and rethrown.
 *
 * @param {string} eslintPath - The path to the ESLint module.
 * @param {ESLint.Options} eslintOptions - The configuration options for initializing ESLint.
 * @returns {Promise<ESLint>} A promise resolving to an ESLint instance.
 * @throws {Error} If ESLint cannot be imported or instantiated, an error is logged and thrown.
 *
 * @example
 * ```ts
 * const eslintInstance = await getESLint('/path/to/eslint', { fix: true });
 * console.log(eslintInstance);
 * ```
 */
export const getESLint = async (eslintPath: string, eslintOptions: ESLint.Options): Promise<typeof ESLint> => {
  const  { ESLint } = await importModule(eslintPath, 'eslint') as unknown as ESLintModule;

  try {
    return new ESLint(eslintOptions);
  } catch (error) {
    logger.error('There was trouble creating the ESLint instance.');
    throw error;
  }
};
