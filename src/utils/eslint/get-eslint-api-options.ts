import { ESLint } from 'eslint';

/**
 * Generates ESLint API options based on the provided ESLint options.
 *
 * This function constructs an object with properties that affect how ESLint's `calculateConfigForFile`
 * function behaves. It ensures default values are assigned if properties are not explicitly provided.
 *
 * @param {ESLint.Options} eslintOptions - The ESLint options.
 * @returns {ESLint.Options} An object containing options for the ESLint API.
 *
 * @example
 * ```ts
 * const eslintOptions = getESLintApiOptions({ ignore: false, plugins: ['react'] });
 * console.log(eslintOptions);
 * // Output: {
 * //   ignore: false,
 * //   allowInlineConfig: true,
 * //   baseConfig: null,
 * //   overrideConfig: null,
 * //   overrideConfigFile: null,
 * //   plugins: ['react']
 * // }
 * ```
 */
export const getESLintApiOptions = (eslintOptions: ESLint.Options): ESLint.Options => {
  return {
    ignore: eslintOptions.ignore ?? true,
    allowInlineConfig: eslintOptions.allowInlineConfig ?? true,
    baseConfig: eslintOptions.baseConfig ?? null,
    overrideConfig: eslintOptions.overrideConfig ?? null,
    overrideConfigFile: eslintOptions.overrideConfigFile ?? null,
    plugins: eslintOptions.plugins ?? null
  };
};
