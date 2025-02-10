/**
 * Checks if a given value is an array of objects.
 *
 * This function verifies that the provided value is an array, and that every
 * element in the array is a non-null object (excluding arrays).
 *
 * @param {unknown} arr - The value to check.
 * @returns {boolean} `true` if the value is an array of objects, otherwise `false`.
 *
 * @example
 * ```ts
 * console.log(isArrayOfObjects([{ a: 1 }, { b: 2 }])); // Output: true
 * console.log(isArrayOfObjects([{ a: 1 }, 'string'])); // Output: false
 * console.log(isArrayOfObjects('not an array')); // Output: false
 * console.log(isArrayOfObjects([[], {}])); // Output: false
 * ```
 */
export const isArrayOfObjects = (arr: unknown): boolean =>
  Array.isArray(arr) && arr.every(item => item !== null && typeof item === 'object' && !Array.isArray(item));
