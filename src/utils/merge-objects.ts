/**
 * Merges an array of objects into a single object.
 *
 * This function takes an array of objects and merges them into a single object.
 * If the input is not an array, it is returned as is. If the array contains only
 * one object, that object is returned directly.
 *
 * @param {object | object[]} input - A single object or an array of objects to merge.
 * @returns {object} The merged object if an array is provided; otherwise, returns the original input.
 *
 * @example
 * ```ts
 * const obj1 = { a: 1, b: 2 };
 * const obj2 = { b: 3, c: 4 };
 * console.log(mergeObjects([obj1, obj2])); // Output: { a: 1, b: 3, c: 4 }
 * ```
 */
export const mergeObjects = (input: object | object[]): object => {
  if (!Array.isArray(input)) return input; // If input is a single object, return it

  if (input.length === 1) return input[0]; // If it's an array with one object, return that object

  return input.reduce((acc, obj) => ({ ...acc, ...obj }), {}); // Merge objects in the array
};
