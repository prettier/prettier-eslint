import getLogger from 'loglevel-colored-level-prefix';
import { oneLine } from "common-tags";
import { Linter } from "eslint";
import { getValue } from "./get-value";
import { RULE_NOT_CONFIGURED } from '../constants';


const logger = getLogger({ prefix: 'prettier-eslint' });

/**
 * Extracts a nested rule value from an ESLint rule object.
 *
 * This function attempts to retrieve a specific value from an object-based ESLint rule configuration.
 * If the requested value cannot be inferred, it logs a debug message and returns `undefined`.
 *
 * @param {string | undefined} objPath - The path to the nested value in the rule configuration.
 * @param {string} name - The name of the ESLint rule.
 * @param {Record<string, unknown>} value - The ESLint rule configuration object.
 * @returns {Linter.RuleEntry | undefined} The extracted value from the ESLint rule configuration or `RULE_NOT_CONFIGURED` if not found.
 *
 * @example
 * ```ts
 * const eslintRuleConfig = { maxLen: { code: 80 } };
 * console.log(extractRuleValue('code', 'max-len', eslintRuleConfig.maxLen)); // Output: 80
 * ```
 */
export const extractRuleValue = (
  objPath: string | undefined,
  name: string,
  value: Record<string, unknown>
): Linter.RuleEntry | undefined => {
  // If objPath is provided, attempt to extract the rule value from the object
  if (objPath) {
    logger.trace(
      oneLine`
        Getting the value from object configuration of ${name}.
        Delving into ${JSON.stringify(value)} with path "${objPath}"
      `
    );

    return getValue(value, objPath, RULE_NOT_CONFIGURED) as Linter.RuleEntry | undefined;
  }

  // If objPath is not provided, log an issue and return undefined
  logger.debug(
    oneLine`
      The ${name} rule is using an object configuration
      of ${JSON.stringify(value)}, but prettier-eslint is
      not currently capable of extracting the Prettier value
      based on an object configuration for ${name}.
      Please file an issue (or submit a pull request?).
    `
  );

  return undefined;
};