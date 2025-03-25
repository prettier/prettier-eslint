import { RULE_DISABLED, RULE_NOT_CONFIGURED } from '../constants';

/**
 * Checks if a given Prettier rule value is valid and configured.
 *
 * This function determines whether the provided Prettier rule value is set and valid.
 * It considers values as non-existent if they are `RULE_NOT_CONFIGURED`, `RULE_DISABLED`, or `undefined`.
 *
 * @param {unknown} prettierRuleValue - The value of the Prettier rule to check.
 * @returns {boolean} `true` if the rule value exists and is valid, otherwise `false`.
 *
 * @example
 * ```ts
 * console.log(ruleValueExists('always')); // Output: true
 * console.log(ruleValueExists(RULE_DISABLED)); // Output: false
 * console.log(ruleValueExists(undefined)); // Output: false
 * ```
 */
export const ruleValueExists = (prettierRuleValue: unknown): boolean =>
  prettierRuleValue !== RULE_NOT_CONFIGURED &&
  prettierRuleValue !== RULE_DISABLED &&
  prettierRuleValue !== undefined;


