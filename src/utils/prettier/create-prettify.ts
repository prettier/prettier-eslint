import { stripIndent } from 'common-tags';
import indentString from 'indent-string';
import getLogger from 'loglevel-colored-level-prefix';

import { PrettierFormatOptions, PrettierInterface, PrettifyInput } from '../../types';
import { importModule } from '../import-module';

const logger = getLogger({ prefix: 'prettier-eslint' });

/**
 * Creates a function that formats text using Prettier.
 *
 * This function initializes Prettier and formats the given text according to the specified formatting options.
 *
 * @param {PrettierFormatOptions} formatOptions - The options to pass to Prettier.
 * @param {string} prettierPath - The path to the Prettier module.
 * @returns {(param: string | PrettifyInput) => Promise<{ output: string; messages: string[] }>}
 *          A function that formats text using Prettier.
 *
 * @example
 * ```ts
 * const prettify = createPrettify({ semi: false, singleQuote: true }, '/path/to/prettier');
 * const result = await prettify('const x=1;');
 * console.log(result.output); // Formatted code
 * ```
 */
export const createPrettify = (
  formatOptions: PrettierFormatOptions,
  prettierPath: string
): ((param: string | PrettifyInput) => Promise<{ output: string; messages: string[] }>) => {
  return async function prettify(param: string | PrettifyInput) {
    let text: string;
    let messages: string[] = [];

    if (typeof param === 'string') {
      text = param;
    } else {
      text = param.output;
      messages = param.text;
    }

    logger.debug('Calling Prettier on text');
    logger.trace(
      stripIndent`
      Prettier input:

      ${indentString(text, 2)}
    `
    );

    const Prettier = await importModule(prettierPath, 'prettier') as unknown as PrettierInterface;

    try {
      logger.trace('Calling Prettier.format with the text and formatOptions');

      const output = await Prettier.format(text, formatOptions);

      logger.trace('Prettier: output === input', output === text);
      logger.trace(
        stripIndent`
        Prettier output:

        ${indentString(output, 2)}
      `
      );

      return { output, messages };
    } catch (error) {
      logger.error('Prettier formatting failed due to a Prettier error');
      throw error;
    }
  };
};
