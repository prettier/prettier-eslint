import { ESLint } from "eslint";
import { FormattingOptions } from "../types";
import { getRelevantESLintOptions } from "./eslint/get-relevant-eslint-options";
import { getPrettierOptionsFromESLintRules } from "./prettier/get-prettier-options-from-eslint-rules";

/**
 * Extracts and prepares formatting options for ESLint and Prettier.
 *
 * This function retrieves relevant ESLint options and converts applicable ESLint rules
 * into Prettier options. It ensures Prettier settings are derived correctly, using the provided
 * options or fallback values if necessary.
 *
 * @param {ESLint.Options} eslintOptions - The ESLint options.
 * @param {Record<string, unknown>} prettierOptions - The Prettier options (default: `{}`).
 * @param {Record<string, unknown>} fallbackPrettierOptions - The fallback Prettier options if values are missing (default: `{}`).
 * @returns {FormattingOptions} An object containing both the ESLint and Prettier options.
 *
 * @example
 * ```ts
 * const eslintOptions: Linter.Config = { rules: { semi: ['error', 'always'] } };
 * const formattingOptions = getOptionsForFormatting(eslintOptions);
 * console.log(formattingOptions);
 * ```
 */
export const getOptionsForFormatting = (
  eslintOptions: ESLint.Options,
  prettierOptions: Record<string, unknown> = {},
  fallbackPrettierOptions: Record<string, unknown> = {}
): FormattingOptions => {
  return {
    eslint: getRelevantESLintOptions(eslintOptions),
    prettier: getPrettierOptionsFromESLintRules(eslintOptions, prettierOptions, fallbackPrettierOptions),
  };
};
