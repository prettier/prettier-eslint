import { ESLint, Linter } from 'eslint';

import { getRuleValue } from '../get-rule-value';
import { mergeObjects } from '../merge-objects';
import { OPTION_GETTERS } from '../option-getters';
import { ruleValueExists } from '../rule-value-exists';

import { configurePrettierOptions } from './configure-prettier-options';

/**
 * Converts an ESLint options into Prettier options.
 *
 * This function extracts relevant ESLint rules and maps them to equivalent Prettier options.
 * It also merges any explicitly configured Prettier rules from `prettier/prettier` in the ESLint options.
 *
 * @param {ESLint.Options} eslintOptions - The ESLint options object.
 * @param {Record<string, unknown>} prettierOptions - The Prettier options to be applied.
 * @param {Record<string, unknown>} fallbackPrettierOptions - Fallback options for Prettier.
 * @returns {Record<string, unknown>} A Prettier options object derived from the ESLint options.
 *
 * @example
 * ```ts
 * const eslintOptions: Linter.Config = { rules: { 'prettier/prettier': ['error', { semi: false }] } };
 * const prettierOptions = getPrettierOptionsFromESLintRules(eslintOptions, {}, {});
 * console.log(prettierOptions); // Output: { semi: false }
 * ```
 */
export const getPrettierOptionsFromESLintRules = (
  eslintOptions: ESLint.Options,
  prettierOptions: Record<string, unknown>,
  fallbackPrettierOptions: Record<string, unknown>
): Record<string, unknown> => {
  const config = mergeObjects(eslintOptions) as Linter.Config;
  const { rules } = config;

  if(rules){
    // Extract Prettier-specific ESLint rules
    const prettierPluginOptions = getRuleValue(rules, 'prettier/prettier') as object;

    if (ruleValueExists(prettierPluginOptions)) {
      prettierOptions = { ...prettierPluginOptions, ...prettierOptions };
    }
  }

  // Map ESLint rules to Prettier options using OPTION_GETTERS
  return Object.keys(OPTION_GETTERS).reduce(
    (options, key) =>
      configurePrettierOptions(prettierOptions, fallbackPrettierOptions, key, options, rules),
    prettierOptions
  );
};
