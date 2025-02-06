import { stripIndent } from 'common-tags';
import { ESLint, Linter } from 'eslint';
import indentString from 'indent-string';
import getLogger from 'loglevel-colored-level-prefix';
import { mergeObjects } from '../merge-objects';
import { getESLint } from './get-eslint';
import {format as prettyFormat} from 'pretty-format';

const logger = getLogger({ prefix: 'prettier-eslint' });


/**
 * Creates a function to apply ESLint fixes to a given text.
 *
 * This function initializes an ESLint instance using the provided options and attempts
 * to fix any linting issues in the given text. It returns the fixed text and any ESLint messages.
 *
 * @param {ESLint.Options} eslintOptions - The ESLint options.
 * @param {string} eslintPath - The path to the ESLint module.
 * @returns {(text: string, filePath: string) => Promise<{ output: string; messages: any[] }>}
 *          A function that takes `text` and `filePath` and returns the fixed text along with ESLint messages.
 *
 * @example
 * ```ts
 * const eslintFix = createEslintFix(eslintOptions, '/path/to/eslint');
 * const result = await eslintFix('const x=1;', 'example.js');
 * console.log(result.output); // Formatted code
 * console.log(result.messages); // ESLint messages
 * ```
 */
export const createEslintFix = (
  eslintOptions: ESLint.Options,
  eslintPath: string
): ((text: string, filePath: string|undefined) => Promise<{ output: string; messages: any[] }>) => {
  return async function eslintFix(text: string, filePath: string|undefined) {

    if(!eslintOptions.baseConfig) throw new Error('No baseConfig found in eslintOptions');

    const mergedConfigs = mergeObjects(eslintOptions.baseConfig) as Linter.Config;

      // Convert global settings from an array to an object if necessary
      if (mergedConfigs.languageOptions && Array.isArray(mergedConfigs.languageOptions.globals)) {
        const tempGlobals: Linter.Globals = {};
        mergedConfigs.languageOptions.globals.forEach((g) => {
          const [key, value] = g.split(':');
          tempGlobals[key] = value;
        });
        mergedConfigs.languageOptions.globals = tempGlobals;
      }




    // Extract specific ESLint configuration settings
    const {
      plugins,
      ignores,
      languageOptions,
      rules,
      linterOptions,
      settings,
      ...restConfig
    } = mergedConfigs;

    // Construct the next ESLint options
    const nextEslintOptions = {
      ...eslintOptions,
      baseConfig: {...restConfig},
      overrideConfig: {
        ignores,
        linterOptions,
        languageOptions,
        plugins,
        rules,
        settings,
        ...eslintOptions.overrideConfig,
      },
    };

    // Initialize ESLint instance
    const eslint = await getESLint(eslintPath, nextEslintOptions) as unknown as ESLint;

    try {
      logger.trace('Calling ESLint lintText with the provided text');

      // Run ESLint fix on the provided text
      const report = await eslint.lintText(text, {
        filePath,
        warnIgnored: true,
      });

      logger.trace('ESLint lintText returned the following report:', prettyFormat(report));

      // Extract the formatted output and messages
      const [{ output = text, messages }] = report;

      logger.trace('ESLint --fix: output === input', output === text);

      // Log the output for debugging purposes
      logger.trace(
        stripIndent`
        ESLint --fix output:

        ${indentString(output, 2)}
      `
      );

      return { output, messages };
    } catch (error) {
      logger.error('ESLint fix failed due to an ESLint error');
      throw error;
    }
  };
};
