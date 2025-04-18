import { type Options as PrettierOptions } from 'prettier';
import type { ESLintOptions, ESLintConfig } from './types.ts';
export declare function getOptionsForFormatting(eslintConfig: ESLintConfig, prettierOptions?: PrettierOptions, fallbackPrettierOptions?: PrettierOptions): {
    eslint: ESLintConfig;
    prettier: PrettierOptions;
};
export declare function requireModule<T>(modulePath: string, name: string): T;
export declare function getESLint(eslintPath: string, eslintOptions: ESLintOptions): import("eslint").ESLint;
export type StringLiteral<T> = T | (string & {
    _?: never;
});
