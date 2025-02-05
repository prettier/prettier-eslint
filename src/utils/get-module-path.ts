import { oneLine } from "common-tags";
import requireRelative from "require-relative";
import getLogger from 'loglevel-colored-level-prefix';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const logger = getLogger({ prefix: 'prettier-eslint' });

/**
 * Resolves the absolute path to a module relative to a given file path.
 *
 * This function attempts to resolve a module's path relative to the provided `filePath`. If the module cannot be found
 * in the specified location, it falls back to resolving the module globally using `require.resolve`.
 *
 * @param {string} filePath - The file path from which to resolve the module.
 * @param {string} moduleName - The name of the module to resolve.
 * @returns {string} The resolved module path.
 *
 * @example
 * ```ts
 * const eslintPath = getModulePath('./example.js', 'eslint');
 * console.log(eslintPath); // Output: Absolute path to the ESLint module
 * ```
 */
export const getModulePath = (filePath: string, moduleName: string): string => {
  try {
    return requireRelative.resolve(moduleName, filePath);
  } catch (error: any) {
    logger.debug(
      oneLine`
        There was a problem finding the ${moduleName}
        module. Using prettier-eslint's version.
      `,
      error.message,
      error.stack
    );
    return require.resolve(moduleName);
  }
}
