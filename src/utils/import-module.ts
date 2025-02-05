import getLogger from 'loglevel-colored-level-prefix';
import { oneLine } from "common-tags";
import { DynamicImportReturnType } from "../types";

const logger = getLogger({ prefix: 'prettier-eslint' });
/**
 * Dynamically imports a module and returns its default export.
 *
 * This function attempts to import a module dynamically using `import()`. If successful,
 * it extracts and returns the module's default export. If the import fails, an error is logged and rethrown.
 *
 * @param {string} modulePath - The path to the module to be imported.
 * @param {string} name - The name of the module (used for logging and debugging).
 * @returns {DynamicImportReturnType} A promise that resolves to the module's default export.
 * @throws {Error} If the module cannot be imported, an error is logged and thrown.
 *
 * @example
 * ```ts
 * try {
 *   const prettier = await importModule('/path/to/prettier', 'prettier');
 *   console.log(prettier);
 * } catch (error) {
 *   console.error('Failed to import module:', error);
 * }
 * ```
 */
export const importModule = async (modulePath: string, name: string): DynamicImportReturnType =>{
  try {
    logger.trace(`Importing "${name}" module from "${modulePath}"`);
    
    // Dynamically import the module and return its default export
    return await import(modulePath).then(({ default: defaultExport }) => defaultExport);
  } catch (error) {
    logger.error(
      oneLine`
        There was trouble importing "${name}".
        Is "${modulePath}" a correct path to the "${name}" module?
      `
    );
    throw error;
  }
}