import { ESLint, type Linter } from 'eslint';
import type { Options as PrettierOptions } from 'prettier';
import { StringLiteral } from './utils';
export type LogLevel = 'debug' | 'error' | 'info' | 'silent' | 'trace' | 'warn';
export type { PrettierOptions };
export interface FormatOptions {
    eslintConfig?: ESLintConfig;
    eslintPath?: string;
    fallbackPrettierOptions?: PrettierOptions;
    filePath?: string;
    logLevel?: LogLevel;
    prettierOptions?: PrettierOptions;
    prettierPath?: string;
    prettierLast?: boolean;
    text?: string;
}
export interface PrettifyInput {
    output: string;
    messages: Linter.LintMessage[];
}
export interface OptionGetter {
    ruleValue: (rules?: Partial<Linter.RulesRecord>) => StringLiteral<Linter.RuleEntry> | undefined;
    ruleValueToPrettierOption: (...args: any[]) => unknown;
}
export type ESLintOptions = Omit<ESLint.Options, 'plugins' | 'reportUnusedDisableDirectives'>;
export type ValueOf<T> = T[keyof T];
export type ESLintConfigGlobals = Linter.Config['globals'];
export type ESLintConfigGlobalValue = ValueOf<NonNullable<ESLintConfigGlobals>>;
export interface ESLintConfig extends Omit<Linter.Config, 'globals'>, ESLintOptions {
    globals?: ESLintConfigGlobals | [`${string}:${ESLintConfigGlobalValue}`];
    ignorePattern?: string[] | string;
}
