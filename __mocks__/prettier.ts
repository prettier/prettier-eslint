import { fileURLToPath } from 'node:url';

import type { Options } from 'prettier';
import { vi } from 'vitest';

import type { PrettierMock } from '../mock.js';

const prettier = await vi.importActual<PrettierMock>('prettier');

const { format } = prettier;

const mockFormatSpy = vi.fn(mockFormat);
const resolveConfig = vi.fn();

const prettierMock = {
  ...prettier,
  format: mockFormatSpy,
  resolveConfig,
};

export { mockFormatSpy as format, resolveConfig };
export default prettierMock;

function mockFormat(source: string, options?: Options) {
  globalThis.__PRETTIER_ESLINT_TEST_STATE__.prettierPath = fileURLToPath(
    import.meta.url,
  );

  if (
    'throwError' in mockFormatSpy &&
    mockFormatSpy.throwError instanceof Error
  ) {
    throw mockFormatSpy.throwError;
  }

  return format(source, options);
}
