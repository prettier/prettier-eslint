/**
 * We can not use `.ts` because it's called by
 * `test/fixtures/node_modules/prettier/index.js`
 */

import type { Options } from 'prettier';

import type { PrettierMock } from '../mock.js';

const prettier = jest.requireActual<PrettierMock>('prettier');

const { format } = prettier;

export = prettier;

const mockFormatSpy = jest.fn(mockFormat);

Object.assign(prettier, {
  format: mockFormatSpy,
  resolveConfig: jest.fn(),
});

function mockFormat(source: string, options?: Options) {
  globalThis.__PRETTIER_ESLINT_TEST_STATE__.prettierPath = __filename;

  if (
    'throwError' in mockFormatSpy &&
    mockFormatSpy.throwError instanceof Error
  ) {
    throw mockFormatSpy.throwError;
  }

  return format(source, options);
}
