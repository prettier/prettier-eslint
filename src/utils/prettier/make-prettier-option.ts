import getLogger from 'loglevel-colored-level-prefix';
import { ruleValueExists } from '../rule-value-exists';
import { oneLine } from 'common-tags';

const logger = getLogger({ prefix: 'prettier-eslint' });
/**
 * Determines the appropriate Prettier option value based on rule configuration and fallbacks.
 *
 * This function first checks if a specific Prettier rule is explicitly configured. If not, it attempts
 * to use a provided fallback value. If no fallback exists, Prettier is allowed to use its default behavior.
 *
 * @param {string} prettierRuleName - The name of the Prettier rule.
 * @param {unknown} prettierRuleValue - The configured value for the Prettier rule.
 * @param {Record<string, unknown>} fallbacks - An object containing fallback values for Prettier rules.
 * @returns {unknown} The determined Prettier rule value or `undefined` if not configured.
 *
 * @example
 * ```ts
 * const fallbacks = { semi: false, singleQuote: true };
 * const semiOption = makePrettierOption('semi', undefined, fallbacks);
 * console.log(semiOption); // Output: false (fallback value)
 * ```
 */
export const makePrettierOption = (
  prettierRuleName: string,
  prettierRuleValue: unknown,
  fallbacks: Record<string, unknown>
): unknown => {
  if (ruleValueExists(prettierRuleValue)) {
    return prettierRuleValue;
  }

  const fallback = fallbacks[prettierRuleName];

  if (fallback !== undefined) {
    logger.debug(
      oneLine`
        The ${prettierRuleName} rule is not configured,
        using provided fallback of ${fallback}
      `
    );
    return fallback;
  }

  logger.debug(
    oneLine`
      The ${prettierRuleName} rule is not configured,
      letting Prettier decide.
    `
  );

  return undefined;
};
