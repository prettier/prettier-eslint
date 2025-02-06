import { ESLint, Linter } from 'eslint';
import { ResolveConfigOptions, Options} from 'prettier';


export interface FormatOptions {
  /** The path of the file being formatted. Used to find the relevant ESLint config and load text if not provided. */
  filePath?: string|undefined;

  /** The JavaScript code to format. If not provided, it will be loaded from the `filePath`. */
  text?: string;

  /** The path to the ESLint module to use. Defaults to `require.resolve('eslint')`. */
  eslintPath?: string;

  /** The path to the Prettier module. Defaults to `require.resolve('prettier')`. */
  prettierPath?: string;

  /** The ESLint options to use for formatting. If not provided, the config is inferred from the file path. */
  eslintOptions?: ESLint.Options;

  /** Options to pass to Prettier. If not provided, options will be inferred from ESLint config. */
  prettierOptions?: PrettierFormatOptions;

  /** Fallback options for Prettier if they cannot be inferred from ESLint config. */
  fallbackPrettierOptions?: Record<string, unknown> | undefined;

  /** Log level for debugging (error, warn, info, debug, trace). */
  logLevel?: string;

  /** Whether to run Prettier after ESLint. Defaults to `false`. */
  prettierLast?: boolean;
}



/**
 * Represents options for Prettier formatting.
 */
export interface PrettierFormatOptions {
  [key: string]: unknown; // Allows flexibility for different Prettier options
}

/**
 * Represents the input for the `prettify` function.
 */
export interface PrettifyInput {
  output: string;
  text: Linter.LintMessage[];
}



export type DynamicImportReturnType = Promise<Record<string, unknown>>;

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ESLintModule {
  Linter: { new (...args: any[]): any };
  loadESLint: (...args: any[]) => Promise<any>;
  ESLint: { new (...args: any[]): any; configType: string };
  RuleTester: { new (...args: any[]): any };
  SourceCode: { new (...args: any[]): any };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Represents the formatting options returned by `getOptionsForFormatting`.
 */
export interface FormattingOptions {
  eslint: ESLint.Options; // The relevant ESLint options
  prettier: Record<string, unknown>; // The Prettier configuration derived from ESLint
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Represents the structure of an option getter for mapping ESLint rules to Prettier options.
 */
export interface OptionGetter {
  /**
   * Function that retrieves the ESLint rule value.
   * @param {Partial<Linter.RulesRecord>} rules - The ESLint rules configuration.
   * @returns {Linter.RuleEntry | undefined | string | string} The value of the specified ESLint rule.
   */
  ruleValue: (rules: Partial<Linter.RulesRecord>) => Linter.RuleEntry | undefined | string | string;

  /**
   * Function that converts the ESLint rule value to a corresponding Prettier option.
   * @param {...args: any[]} ruleValue - The ESLint rule value.
   * @returns {unknown} The converted Prettier option value.
   */
  ruleValueToPrettierOption: (...args: any[]) => unknown;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
export interface PrettierInterface {
  format: (text: string, formatOptions: Options) => Promise<string>,
  resolveConfig: (
    fileUrlOrPath: string | URL,
    options?: ResolveConfigOptions,
  ) => Promise<Options | null>
}
