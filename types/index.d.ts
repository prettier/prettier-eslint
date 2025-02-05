import { ESLint } from 'eslint';

interface FormatOptions {
    /** The path of the file being formatted. Used to find the relevant ESLint config and load text if not provided. */
    filePath?: string | undefined;
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
interface PrettierFormatOptions {
    [key: string]: unknown;
}

/**
 * Formats JavaScript code using Prettier and then ESLint based on the provided options.
 *
 * This function first analyzes the code using ESLint and Prettier, then returns the formatted output.
 *
 * @param {FormatOptions} options - The configuration options for formatting.
 * @returns {Promise<string>} A promise that resolves with the formatted code.
 *
 * @example
 * ```ts
 * const formattedCode = await format({ filePath: './example.js', text: 'const x=1;' });
 * console.log(formattedCode); // Output: 'const x = 1;'
 * ```
 */
declare const format: (options: FormatOptions) => Promise<string>;
/**
 * Analyzes and formats text using Prettier and ESLint.
 *
 * This function applies Prettier and ESLint formatting based on the provided options.
 * It first retrieves configuration settings from the given file path and modules,
 * then formats the code accordingly. The function ensures proper ordering of Prettier
 * and ESLint operations based on the `prettierLast` flag.
 *
 * @param {FormatOptions} options - The configuration options for formatting.
 * @returns {Promise<{ output: string; messages: any[] }>}
 *          A promise resolving to an object containing formatted output and ESLint messages.
 *
 * @example
 * ```ts
 * const formatted = await analyze({ filePath: './example.js', text: 'const x=1;' });
 * console.log(formatted.output); // Formatted code
 * ```
 */
declare const analyze: (options: FormatOptions) => Promise<{
    output: string;
    messages: any[];
}>;

export { analyze, format };
