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
export const deepMerge = (target, ...sources) => {
  if (!target || typeof target !== 'object' || target === null) {
    return target;
  }

  for (const source of sources) {
    if (!source || typeof source !== 'object' || source === null) {
      continue;
    }

    for (const key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) {
        continue;
      }

      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      const sourceValue = source[key];
      const targetValue = target[key];

      if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
        // Merge arrays by concatenating
        target[key] = [...targetValue, ...sourceValue];
      } else if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue)
      ) {
        // Recursively merge objects, ensuring the target is a valid object
        target[key] = deepMerge(
          targetValue && typeof targetValue === 'object' ? targetValue : {},
          sourceValue
        );
      } else if (sourceValue !== undefined) {
        // Assign non-object values
        target[key] = sourceValue;
      }
    }
  }

  return target;
};
