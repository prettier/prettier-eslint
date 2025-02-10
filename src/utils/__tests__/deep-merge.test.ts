import test from 'node:test';
import assert from 'node:assert/strict';
import { deepMerge } from '../deep-merge';

// Test merging simple objects
test('merges two simple objects', () => {
  const obj1 = { a: 1, b: 2 };
  const obj2 = { b: 3, c: 4 };
  const result = deepMerge(obj1, obj2);
  assert.deepStrictEqual(result, { a: 1, b: 3, c: 4 });
});

// Test merging nested objects
test('merges nested objects', () => {
  const obj1 = { a: { b: 1 } };
  const obj2 = { a: { c: 2 } };
  const result = deepMerge(obj1, obj2);
  assert.deepStrictEqual(result, { a: { b: 1, c: 2 } });
});

// Test merging arrays
test('concatenates arrays', () => {
  const obj1 = { a: [1, 2] };
  const obj2 = { a: [3, 4] };
  const result = deepMerge(obj1, obj2);
  assert.deepStrictEqual(result, { a: [1, 2, 3, 4] });
});

// Test merging objects with undefined values
test('preserves existing values when source has undefined', () => {
  const obj1 = { a: 1, b: 2 };
  const obj2 = { b: undefined, c: 3 };
  const result = deepMerge(obj1, obj2);
  assert.deepStrictEqual(result, { a: 1, b: 2, c: 3 });
});

// Test merging multiple objects
test('merges multiple objects deeply', () => {
  const obj1 = { a: 1, b: { c: 2 } };
  const obj2 = { b: { d: 3 }, e: [4, 5] };
  const obj3 = { f: 6 };
  const result = deepMerge(obj1, obj2, obj3);
  assert.deepStrictEqual(result, { a: 1, b: { c: 2, d: 3 }, e: [4, 5], f: 6 });
});

// Test empty merge
test('returns empty object when no sources provided', () => {
  const result = deepMerge();
  assert.deepStrictEqual(result, {});
});
