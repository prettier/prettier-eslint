import { Linter } from "eslint";
import { OptionGetter } from "../types";
import { getArrowParens, getBracketSameLine, getBracketSpacing, getPrintWidth, getSemi, getSingleQuote, getTabWidth, getTrailingComma, getUseTabs } from "./prettier/get-prettier-functions";
import { getRuleValue } from "./get-rule-value";

/**
 * Mapping of Prettier options to their corresponding ESLint rule values and converters.
 *
 * This object defines how various ESLint rules can be mapped to their equivalent Prettier options.
 */
export const OPTION_GETTERS: Record<string, OptionGetter> = {
  printWidth: {
    ruleValue: (rules) => getRuleValue(rules, 'max-len', 'code'),
    ruleValueToPrettierOption: getPrintWidth,
  },
  tabWidth: {
    ruleValue: (rules: Partial<Linter.RulesRecord>) => {
      let value = getRuleValue(rules, 'indent');
      if (value === 'tab') {
        value = getRuleValue(rules, 'max-len', 'tabWidth');
      }
      return value;
    },
    ruleValueToPrettierOption: getTabWidth,
  },
  singleQuote: {
    ruleValue: (rules: Partial<Linter.RulesRecord>) => getRuleValue(rules, 'quotes'),
    ruleValueToPrettierOption: getSingleQuote,
  },
  trailingComma: {
    ruleValue: (rules: Partial<Linter.RulesRecord>) => getRuleValue(rules, 'comma-dangle'),
    ruleValueToPrettierOption: getTrailingComma,
  },
  bracketSpacing: {
    ruleValue: (rules: Partial<Linter.RulesRecord>) => getRuleValue(rules, 'object-curly-spacing'),
    ruleValueToPrettierOption: getBracketSpacing,
  },
  semi: {
    ruleValue: (rules: Partial<Linter.RulesRecord>) => getRuleValue(rules, 'semi'),
    ruleValueToPrettierOption: getSemi,
  },
  useTabs: {
    ruleValue: (rules: Partial<Linter.RulesRecord>) => getRuleValue(rules, 'indent'),
    ruleValueToPrettierOption: getUseTabs,
  },
  bracketSameLine: {
    ruleValue: (rules: Partial<Linter.RulesRecord>) => getRuleValue(rules, 'react/jsx-closing-bracket-location', 'nonEmpty'),
    ruleValueToPrettierOption: getBracketSameLine,
  },
  arrowParens: {
    ruleValue: (rules: Partial<Linter.RulesRecord>) => getRuleValue(rules, 'arrow-parens'),
    ruleValueToPrettierOption: getArrowParens,
  },
};
