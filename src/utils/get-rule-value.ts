import { oneLine } from 'common-tags';
import { Linter } from 'eslint';
import getLogger from 'loglevel-colored-level-prefix';

import { RULE_DISABLED, RULE_NOT_CONFIGURED } from '../constants';

import { extractRuleValue } from './extract-rule-value';

const logger = getLogger({ prefix: 'prettier-eslint' });

/**
 * Extracts a rule value from an ESLint configuration.
 *
 * This function retrieves the value of a specified ESLint rule. If the rule is disabled (`0` or `'off'`),
 * it returns `RULE_DISABLED`. If the rule is configured with an object, it extracts the value from the given path.
 * Otherwise, it logs and returns the rule's direct value.
 *
 * @param {Partial<Linter.RulesRecord>} rules - The ESLint rules configuration.
 * @param {string} name - The name of the ESLint rule to retrieve.
 * @param {string} [objPath] - The object path used to extract values when the rule is an object.
 * @returns {Linter.RuleEntry | undefined | string} The extracted rule value, `RULE_DISABLED` if the rule is off, or `RULE_NOT_CONFIGURED` if unset.
 *
 * @example
 * ```ts
 * const rules = { semi: ['error', 'always'], quotes: ['off'] };
 * console.log(getRuleValue(rules, 'semi', 'style')); // Output: 'always'
 * console.log(getRuleValue(rules, 'quotes', 'style')); // Output: RULE_DISABLED
 * ```
 */
export const getRuleValue = (rules: Partial<Linter.RulesRecord>, name: string, objPath?: string): Linter.RuleEntry | undefined | string | string => {
  const ruleConfig = rules[name];

  if (Array.isArray(ruleConfig)) {
    const [ruleSetting, value] = ruleConfig;

    // If the rule is explicitly disabled, return RULE_DISABLED
    if (ruleSetting === 0 || ruleSetting === 'off') {
      return RULE_DISABLED;
    }

    // If the rule is an object, extract the specified path value
    if (typeof value === 'object' && value !== null) {
      return extractRuleValue(objPath, name, value);
    } else {
      logger.trace(
        oneLine`
          The ${name} rule is configured with a
          non-object value of ${value}. Using that value.
        `
      );

      return value;
    }
  }

  return RULE_NOT_CONFIGURED;
};
