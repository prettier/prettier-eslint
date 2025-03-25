import { ESLint, Linter } from 'eslint';
import getLogger from 'loglevel-colored-level-prefix';

const logger = getLogger({ prefix: 'prettier-eslint' });

/**
 * Sets a specific language option into the ESLint configuration.
 *
 * This function updates the `languageOptions` property within `eslintOptions.baseConfig`,
 * ensuring that the specified property is correctly assigned the given value. It handles
 * cases where `baseConfig` is an array or an object and logs errors if updating fails.
 *
 * @param {ESLint.Options} eslintOptions - The ESLint options object to modify.
 * @param {keyof Linter.LanguageOptions} property - The specific language option property to set.
 * @param {Linter.EcmaVersion | Linter.SourceType | Linter.Globals | Linter.Parser | Linter.ParserOptions | undefined} value - The value to assign to the language option.
 * @throws {Error} If required parameters are missing or updating the configuration fails.
 *
 * @example
 * ```ts
 * const eslintOptions: ESLint.Options = { baseConfig: { languageOptions: { ecmaVersion: 2021 } } };
 * setLanguageOptionsIntoESLintOptions(eslintOptions, 'ecmaVersion', 2022);
 * console.log(eslintOptions.baseConfig?.languageOptions?.ecmaVersion); // Output: 2022
 * ```
 */
export const setLanguageOptionsIntoESLintOptions = (
  eslintOptions: ESLint.Options,
  property: keyof Linter.LanguageOptions,
  value: Linter.EcmaVersion | Linter.SourceType | Linter.Globals | Linter.Parser | Linter.ParserOptions | undefined
): void => {
  // Validate input parameters
  if (!eslintOptions || !property || typeof property !== 'string' || !value) {
    throw new Error('Missing or invalid parameters for setLanguageOptionsIntoESLintOptions');
  }

  try {
    if (Array.isArray(eslintOptions.baseConfig)) {
      // Handle case where baseConfig is an array
      eslintOptions.baseConfig[0].languageOptions = {
        ...eslintOptions.baseConfig[0].languageOptions,
        [property]: value
      };
    } else if (eslintOptions.baseConfig && eslintOptions.baseConfig.languageOptions) {
      // Handle case where baseConfig is an object
      eslintOptions.baseConfig.languageOptions = {
        ...eslintOptions.baseConfig.languageOptions,
        [property]: value
      };
    }
  } catch (error) {
    logger.error('Not able to update languageOptions');
    throw error;
  }
};
