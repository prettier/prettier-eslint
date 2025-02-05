
/**
 * Safely retrieves a nested value from an object using a dot-separated path.
 *
 * This function allows retrieving deeply nested values from an object using a string-based or array-based path.
 * If any part of the path is undefined or does not exist, the provided `defaultValue` is returned.
 *
 * @param {Record<string, unknown>} obj - The object to retrieve the value from.
 * @param {string | string[]} path - A dot-separated string or an array representing the key path.
 * @param {unknown} [defaultValue] - The value to return if the path is not found in the object.
 * @returns {unknown} The retrieved value from the object or the provided default value.
 *
 * @example
 * ```ts
 * const obj = { a: { b: { c: 42 } } };
 * console.log(getValue(obj, 'a.b.c')); // Output: 42
 * console.log(getValue(obj, ['a', 'b', 'c'])); // Output: 42
 * console.log(getValue(obj, 'a.b.d', 'default')); // Output: 'default'
 * ```
 */
export const getValue = (
  obj: Record<string, unknown>,
  path: string | string[],
  defaultValue?: unknown
): unknown => {
  // Convert dot-separated string into an array of keys
  if (typeof path === 'string') {
    path = path.split('.');
  }

  for (const key of path) {
    if (obj && key in obj) {
      obj = obj[key] as Record<string, unknown>;
    } else {
      return defaultValue;
    }
  }

  return obj;
};