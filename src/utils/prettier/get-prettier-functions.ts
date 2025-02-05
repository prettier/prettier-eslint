import { RULE_NOT_CONFIGURED } from "../../constants";
import { isAlways } from "../is-always";
import { makePrettierOption } from "./make-prettier-option";

/** Converts ESLint rule values into Prettier options */
export const getPrintWidth = (eslintValue: unknown, fallbacks: Record<string, unknown>) =>
  makePrettierOption('printWidth', eslintValue, fallbacks);

export const getTabWidth = (eslintValue: unknown, fallbacks: Record<string, unknown>) =>
  makePrettierOption('tabWidth', eslintValue, fallbacks);

export const getSingleQuote = (eslintValue: unknown, fallbacks: Record<string, unknown>) => {
  const prettierValue = eslintValue === 'single' ? true : false;
  return makePrettierOption('singleQuote', prettierValue, fallbacks);
};

export const getTrailingComma = (eslintValue: unknown, fallbacks: Record<string, unknown>) => {
  let prettierValue: string | typeof RULE_NOT_CONFIGURED;

  if (eslintValue === 'never') {
    prettierValue = 'none';
  } else if (typeof eslintValue === 'string' && eslintValue.startsWith('always')) {
    prettierValue = 'es5';
  } else if (typeof eslintValue === 'object') {
    prettierValue = getValFromTrailingCommaConfig(eslintValue as Record<string, unknown>);
  } else {
    prettierValue = RULE_NOT_CONFIGURED;
  }

  return makePrettierOption('trailingComma', prettierValue, fallbacks);
};

/**
 * Determines the correct Prettier option for `trailingComma` based on ESLint config.
 *
 * @param {Record<string, unknown>} objectConfig - ESLint rule configuration for trailing commas.
 * @returns {'all' | 'es5' | 'none'} - The corresponding Prettier trailingComma value.
 */
export const getValFromTrailingCommaConfig = (objectConfig: Record<string, unknown>): 'all' | 'es5' | 'none' => {
  const { arrays = '', objects = '', functions = '' } = objectConfig;
  const fns = isAlways(functions as string);
  const es5 = [arrays, objects].some(val => isAlways(val as string));

  return fns ? 'all' : es5 ? 'es5' : 'none';
};

export const getBracketSpacing = (eslintValue: unknown, fallbacks: Record<string, unknown>) => {
  const prettierValue = eslintValue === 'never' ? false : true;
  return makePrettierOption('bracketSpacing', prettierValue, fallbacks);
};

export const getSemi = (eslintValue: unknown, fallbacks: Record<string, unknown>) => {
  const prettierValue = eslintValue === 'never' ? false : true;
  return makePrettierOption('semi', prettierValue, fallbacks);
};

export const getUseTabs = (eslintValue: unknown, fallbacks: Record<string, unknown>) => {
  const prettierValue = eslintValue === 'tab' ? true : RULE_NOT_CONFIGURED;
  return makePrettierOption('useTabs', prettierValue, fallbacks);
};

export const getBracketSameLine = (eslintValue: unknown, fallbacks: Record<string, unknown>) => {
  let prettierValue: boolean | unknown;

  if (eslintValue === 'after-props') {
    prettierValue = true;
  } else if (['tag-aligned', 'line-aligned', 'props-aligned'].includes(eslintValue as string)) {
    prettierValue = false;
  } else {
    prettierValue = eslintValue;
  }

  return makePrettierOption('bracketSameLine', prettierValue, fallbacks);
};

export const getArrowParens = (eslintValue: unknown, fallbacks: Record<string, unknown>) => {
  const prettierValue = eslintValue === 'as-needed' ? 'avoid' : eslintValue;
  return makePrettierOption('arrowParens', prettierValue, fallbacks);
};
