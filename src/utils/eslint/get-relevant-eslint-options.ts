import { ESLint, Linter, Rule } from 'eslint';
import getLogger from 'loglevel-colored-level-prefix';

const logger = getLogger({ prefix: 'prettier-eslint' });

/**
 * Retrieves a sanitized ESLint options by disabling unfixable rules.
 *
 * This function processes the provided ESLint options, identifying rules that
 * cannot be automatically fixed and disabling them. It then returns an updated options
 * with `fix: true` to enable automatic fixing.
 *
 * @param {ESLint.Options} eslintOptions - The original ESLint options
 * @returns {ESLint.Options} An object containing the modified ESLint options with unfixable rules disabled.
 *
 * @example
 * ```ts
 * const eslintOptions: ESLint.Options = { baseConfig: { rules: { semi: ['error', 'always'], 'no-debugger': ['error'] } }};
 * const sanitizedOptions = getRelevantESLintOptions(eslintOptions);
 * console.log(sanitizedOptions);
 * ```
 */
export const getRelevantESLintOptions = (eslintOptions: ESLint.Options): ESLint.Options => {
  const linter = new Linter({configType: 'eslintrc'});
  const rules = linter.getRules();

  logger.debug('Turning off unfixable rules');

  // Iterate over rules and disable those that are not fixable
  rules.forEach((rule, name) => {
    if (!rule.meta?.fixable) {
      logger.trace('Turning off rule:', name);
      rules.set(name, ['off'] as unknown as Rule.RuleModule);
    }
  });

  // Append `fix: true` to enable automatic fixes
  const finalOptions = {...eslintOptions, fix: true};

  return finalOptions;
};
