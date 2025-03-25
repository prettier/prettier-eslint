import { vi } from 'vitest';
const prettier = await vi.importActual('prettier');
const { format } = prettier;
import prettier from 'prettier';

const mockFormatSpy = vi.fn(mockFormat);

function mockFormat(...args) {
  global.__PRETTIER_ESLINT_TEST_STATE__.prettierPath = __filename;
  if (mockFormatSpy.throwError) {
    throw mockFormatSpy.throwError;
  }

  return format(...args);
}

export default { ...prettier, format: mockFormatSpy, resolveConfig: vi.fn() };
