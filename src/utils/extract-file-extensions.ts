

/**
 * Extracts unique file extensions from an array of glob patterns.
 *
 * This function processes an array of glob-style patterns (e.g., `**\/*.js`, `doc/*.tex`)
 * and extracts the unique file extensions. It also handles patterns that specify multiple
 * extensions using curly braces (e.g., `*.{log,txt}`).
 *
 * @param {string[]} patterns - An array of glob patterns containing file extensions.
 * @returns {string[]} An array of unique file extensions extracted from the patterns.
 *
 * @example
 * ```ts
 * const patterns = ['src/**\/*.js', 'docs/*.{md,txt}', '**\/*.ts'];
 * console.log(extractFileExtensions(patterns)); // Output: ['js', 'md', 'txt', 'ts']
 * ```
 */
export const extractFileExtensions = (patterns: string[]): string[] => {
  const extensions = patterns
    .flatMap((pattern) => {
      // Handle patterns with multiple extensions like `*.{log,txt}`
      const matchMultiple = pattern.match(/\.{([^}]+)}/);
      if (matchMultiple) {
        return matchMultiple[1].split(',');
      }

      // Match standard glob patterns like `**/*.js` or `doc/*.tex`
      const matchSingle = pattern.match(/(?:\/|\*)?\*(\.[a-zA-Z0-9]+)$/);
      if (matchSingle) {
        return matchSingle[1];
      }

      return null;
    })
    .filter((ext): ext is string => ext !== null); // Type assertion to remove `null` values

  return [...new Set(extensions)]; // Remove duplicate extensions
};
