import { PrettierInterface } from "../../types";
import { importModule } from "../import-module";

/**
 * Dynamically imports the Prettier module and retrieves the Prettier configuration for a given file.
 *
 * This function uses `importModule` to load Prettier dynamically from the specified path and then calls
 * `resolveConfig` to retrieve the configuration for the given file. If `resolveConfig` is not available,
 * it returns `undefined`.
 *
 * @param {string} filePath - The path of the file for which the Prettier configuration should be retrieved.
 * @param {string} prettierPath - The path to the Prettier module.
 * @returns {Promise<object | null>} A promise that resolves to the Prettier configuration object or `null` if not found.
 *
 * @example
 * ```ts
 * const prettierConfig = await getPrettierConfig('./example.js', '/path/to/prettier');
 * console.log(prettierConfig);
 * ```
 */
export const getPrettierConfig = async (filePath: string, prettierPath: string): Promise<object | null> => {
  const prettier = await importModule(prettierPath, 'prettier') as unknown as PrettierInterface;

  return prettier.resolveConfig ? await prettier.resolveConfig(filePath) : null;
}
