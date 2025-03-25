

/**
 * Checks if a given string starts with the word "always".
 *
 * This function determines whether the provided value begins with the substring `"always"`.
 *
 * @param {string} val - The string to check.
 * @returns {boolean} `true` if the string starts with `"always"`, otherwise `false`.
 *
 * @example
 * ```ts
 * console.log(isAlways('alwaysStrict')); // Output: true
 * console.log(isAlways('neverStrict'));  // Output: false
 * ```
 */
export const isAlways = (val: string): boolean => {
  return val.startsWith('always');
};