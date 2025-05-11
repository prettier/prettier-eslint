import { ESLint, type Linter } from 'eslint';
import type { Options as PrettierOptions } from 'prettier';

/** Logging level for the traceback of the synchronous formatting process. */
export type LogLevel = 'debug' | 'error' | 'info' | 'silent' | 'trace' | 'warn';

export type { PrettierOptions };

/** Options to format text with Prettier and ESLint. */
export interface FormatOptions {
  /** The config to use for formatting with ESLint. */
  eslintConfig?: ESLintConfig;
  /**
   * The path to the eslint module to use. Will default to
   * require.resolve('eslint')
   */
  eslintPath?: string;
  /**
   * The options to pass for formatting with `prettier` if the given option is
   * not inferrable from the `eslintConfig`.
   */
  fallbackPrettierOptions?: PrettierOptions;
  /**
   * The path of the file being formatted can be used in lieu of `eslintConfig`
   * (eslint will be used to find the relevant config for the file). Will also
   * be used to load the `text` if `text` is not provided.
   */
  filePath?: string;
  /** The level for the logs (`error`, `warn`, `info`, `debug`, `trace`). */
  logLevel?: LogLevel;
  /**
   * The options to pass for formatting with `prettier`. If not provided,
   * prettier-eslint will attempt to create the options based on the
   * `eslintConfig` value.
   */
  prettierOptions?: PrettierOptions;
  /**
   * The path to the `prettier` module. Will default to
   * require.resolve('prettier')
   */
  prettierPath?: string;
  /** Run Prettier last. */
  prettierLast?: boolean;
  /** The text (JavaScript code) to format. */
  text?: string;
}

/** Represents the input for the `prettify` function. */
export interface PrettifyInput {
  output: string;
  messages: Linter.LintMessage[];
}

export type StringLiteral<T> = T | (string & { _?: never });

/**
 * Represents the structure of an option getter for mapping ESLint rules to
 * Prettier options.
 */
export interface OptionGetter {
  /**
   * Function that retrieves the ESLint rule value.
   *
   * @param rules - The ESLint rules configuration.
   * @returns The value of the specified ESLint rule.
   */
  ruleValue: (
    rules?: Partial<Linter.RulesRecord>,
  ) => StringLiteral<Linter.RuleEntry> | undefined;

  /**
   * Function that converts the ESLint rule value to a corresponding Prettier
   * option.
   *
   * @param ruleValue - The ESLint rule value.
   * @returns The converted Prettier option value.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- `unknown` and `never` neither helps
  ruleValueToPrettierOption: (...args: any[]) => unknown;
}

export type ESLintOptions = Omit<
  ESLint.Options,
  'plugins' | 'reportUnusedDisableDirectives'
>;

export type ValueOf<T> = T[keyof T];

export type ESLintConfigLanguageOptions = NonNullable<
  Linter.Config['languageOptions']
>;

export interface ESLintConfig extends Linter.Config, ESLintOptions {}
