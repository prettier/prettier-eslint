/**
 * Deeply merges two or more objects or arrays.
 *
 * This function recursively merges multiple objects or arrays, ensuring deep cloning
 * of nested structures to prevent unintended mutations.
 *
 * @param {...Array<object | unknown[]>} objs - The arrays or objects to merge.
 * @returns {object | unknown[]} The deeply merged object or array.
 *
 * @example
 * ```ts
 * const obj1 = { a: 1, b: { c: 2 } };
 * const obj2 = { b: { d: 3 }, e: 4 };
 * console.log(deepMerge(obj1, obj2)); // Output: { a: 1, b: { c: 2, d: 3 }, e: 4 }
 * ```
 */
export const deepMerge = (...objs: (object | unknown[])[]): object | unknown[] | undefined => {
  /**
   * Retrieves the type of a given value.
   *
   * @param {unknown} obj - The value to determine the type of.
   * @returns {string} The type of the value as a lowercase string.
   */
  const getType = (obj: unknown): string =>
    Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();

  /**
   * Deeply merges two objects.
   *
   * @param {Record<string, unknown>} clone - The target object to merge into.
   * @param {Record<string, unknown>} obj - The source object to merge from.
   */
  const mergeObj = (clone: Record<string, unknown>, obj: Record<string, unknown>): void => {
    Object.entries(obj).forEach(([key, value]) => {
      const type = getType(value);
      if (
        clone[key] !== undefined &&
        getType(clone[key]) === type &&
        ['array', 'object'].includes(type)
      ) {
        clone[key] = deepMerge(clone[key] as object | unknown[], value as object | unknown[]);
      } else {
        clone[key] = structuredClone(value);
      }
    });
  };

  if (objs.length === 0) return {};

  // Create a clone of the first item in the objs array
  let clone = structuredClone(objs.shift());

  for (const obj of objs) {
    const type = getType(obj);

    // If types differ, replace the clone
    if (getType(clone) !== type) {
      clone = structuredClone(obj);
      continue;
    }

    // Merge based on type
    if (type === 'array') {
      clone = [...(clone as unknown[]), ...structuredClone(obj as unknown[])];
    } else if (type === 'object') {
      mergeObj(clone as Record<string, unknown>, obj as Record<string, unknown>);
    } else {
      clone = obj;
    }
  }

  return clone;
};


