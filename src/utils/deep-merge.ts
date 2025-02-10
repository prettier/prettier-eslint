import { isArrayOfObjects } from './is-array-of-objects';

/**
 * Deeply merges multiple objects.
 *
 * This function recursively merges multiple objects, ensuring that nested structures
 * are combined properly. Arrays are concatenated, and properties from later objects
 * overwrite earlier ones.
 *
 * @param {...object[]} sources - The objects to merge.
 * @returns {object} The deeply merged object.
 *
 * @example
 * ```ts
 * const obj1 = { a: 1, b: { c: 2 } };
 * const obj2 = { b: { d: 3 }, e: [4, 5] };
 * console.log(deepMerge(obj1, obj2));
 * // Output: { a: 1, b: { c: 2, d: 3 }, e: [4, 5] }
 * ```
 */
export const deepMerge = (...sources: object[]): object => {
  if (sources.length === 0) return {};

  /**
   * Checks if a value is an object (excluding null).
   *
   * @param {unknown} obj - The value to check.
   * @returns {boolean} `true` if the value is an object, otherwise `false`.
   */
  const isObject = (obj: unknown): obj is Record<string, unknown> =>
    obj !== null && typeof obj === 'object';
  /**
   * Recursively merges two objects.
   *
   * @param {Record<string, unknown>} target - The target object to merge into.
   * @param {Record<string, unknown>} source - The source object providing properties.
   * @returns {Record<string, unknown>} The merged object.
   */
  const merge = (
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> => {
    if (!isObject(target) || !isObject(source)) {
      return source;
    }

    Object.keys(source).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const targetValue = target[key];
        const sourceValue = source[key];

        if (sourceValue === undefined && targetValue !== undefined) {
          return;
        }

        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
          // A hack to stop merging rules values
          if(isArrayOfObjects(sourceValue)){
            target[key] = [...new Set([...targetValue, ...sourceValue])];
          } else {
            target[key] = [...new Set([...sourceValue])];
          }
        } else if (isObject(targetValue) && isObject(sourceValue)) {
          target[key] = merge({ ...targetValue }, sourceValue);
        } else {
          target[key] = sourceValue;
        }
      }
    });

    return target;
  };

  return sources.reduce((acc, source) => merge(acc as Record<string, unknown>, source as Record<string, unknown>), {});
};


