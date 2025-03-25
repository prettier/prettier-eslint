import { ESLint } from 'eslint';

import { mergeObjects } from '../merge-objects';

/**
 * Normalizes the `baseConfig` property in ESLint options.
 *
 * If `baseConfig` is an array, it merges all configurations using `deepMerge`
 * to create a single consolidated configuration. If `baseConfig` is ommited,
 * populate with an empty rules object. Otherwise, it returns the options unchanged.
 *
 * @param {ESLint.Options} options - The ESLint options to normalize.
 * @returns {ESLint.Options} The normalized ESLint options.
 *
 * @example
 * ```ts
 * const options: ESLint.Options = {
 *   baseConfig: [{ rules: { semi: ['error', 'always'] } }, { rules: { quotes: ['error', 'single'] } }]
 * };
 * console.log(normalizeBaseConfigInESLintOptions(options));
 * // Output: { baseConfig: { rules: { semi: ['error', 'always'], quotes: ['error', 'single'] } } }
 * ```
 */
export const normalizeBaseConfigInESLintOptions = (
  options: ESLint.Options
): ESLint.Options => {
  if (!options) return {};

  const { baseConfig } = options;

  if (baseConfig && Array.isArray(baseConfig)) {
    return {
      ...options,
      baseConfig: mergeObjects(baseConfig)
    };
  }

  if (!baseConfig)
    return {
      ...options,
      baseConfig: { rules: {} }
    };

  return options;
};
