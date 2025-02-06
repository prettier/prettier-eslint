import { Linter } from 'eslint';

import { OPTION_GETTERS } from '../option-getters';

/**
 * Configures Prettier options based on ESLint rules.
 *
 * If a Prettier option is explicitly provided, it is used. Otherwise, the function
 * derives the corresponding Prettier option from ESLint rules.
 *
 * @param {Record<string, unknown>} prettierOptions - The current Prettier options.
 * @param {Record<string, unknown>} fallbackPrettierOptions - Fallback Prettier options if values are missing.
 * @param {string} key - The name of the Prettier option being configured.
 * @param {Record<string, unknown>} options - The object where configured options are stored.
 * @param {Partial<Linter.RulesRecord> | undefined} rules - The ESLint rules configuration.
 * @returns {Record<string, unknown>} Updated Prettier options with configured values.
 */
export const configurePrettierOptions = (
  prettierOptions: Record<string, unknown>,
  fallbackPrettierOptions: Record<string, unknown>,
  key: string,
  options: Record<string, unknown>,
  rules: Partial<Linter.RulesRecord> | undefined
): Record<string, unknown> => {
  const givenOption = prettierOptions[key];
  const optionIsGiven = givenOption !== undefined;

  if (optionIsGiven) {
    options[key] = givenOption;
  } else {
    const { ruleValue, ruleValueToPrettierOption } = OPTION_GETTERS[key];

    if(rules){
      const eslintRuleValue = ruleValue(rules);
      const option = ruleValueToPrettierOption(eslintRuleValue, fallbackPrettierOptions, rules);

      if (option !== undefined) {
        options[key] = option;
      }
    }
  }

  return options;
};
