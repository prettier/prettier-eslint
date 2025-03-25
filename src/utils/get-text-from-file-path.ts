import { oneLine } from 'common-tags';
import getLogger from 'loglevel-colored-level-prefix';

import fs from 'node:fs';

const logger = getLogger({ prefix: 'prettier-eslint' });

/**
 * Reads and returns the content of a file as a UTF-8 string.
 *
 * This function attempts to read the content of the specified file using `fs.readFileSync`.
 * If the operation fails, it logs an error and throws the corresponding error.
 *
 * @param {string} filePath - The path to the file to read.
 * @returns {string} The content of the file as a UTF-8 string.
 * @throws {Error} If the file cannot be read, an error is logged and thrown.
 *
 * @example
 * ```ts
 * try {
 *   const fileContent = getTextFromFilePath('./example.js');
 *   console.log(fileContent);
 * } catch (error) {
 *   console.error('Failed to read file:', error);
 * }
 * ```
 */
export const getTextFromFilePath = (filePath: string): string => {
  try {
    logger.trace(
      oneLine`
        Attempting fs.readFileSync to get
        the text for file at "${filePath}"
      `
    );

    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    logger.error(
      oneLine`
        Failed to get the text to format
        from the given filePath: "${filePath}"
      `
    );

    throw error; // Re-throws the error to be handled by the caller
  }
};
