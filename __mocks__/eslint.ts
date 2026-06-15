import { fileURLToPath } from 'node:url';

import type eslint_ from 'eslint';
import type { ESLint as ESLint_ } from 'eslint';
import { vi } from 'vitest';

import type { ESLintLintText, MockESLint } from '../mock.js';

import type { ESLintConfig } from 'prettier-eslint';

const eslint = await vi.importActual<typeof eslint_>('eslint');

const { ESLint: ActualESLint } = eslint;

const mockCalculateConfigForFileSpy = vi.fn(mockCalculateConfigForFile);

Object.assign(mockCalculateConfigForFileSpy, { overrides: {} });

const mockLintTextSpy = vi.fn(mockLintText);

const MockedESLint = vi.fn(createMockESLint);

const mock = {
  calculateConfigForFile: mockCalculateConfigForFileSpy,
  lintText: mockLintTextSpy,
};

const eslintMock = {
  ...eslint,
  ESLint: MockedESLint,
  mock,
};

export { MockedESLint as ESLint, mock };
export default eslintMock;

function createMockESLint(options: ESLint_.Options): MockESLint {
  globalThis.__PRETTIER_ESLINT_TEST_STATE__.eslintPath = fileURLToPath(
    import.meta.url,
  );
  const eslintInstance = new ActualESLint(options) as MockESLint;
  eslintInstance.calculateConfigForFile = mockCalculateConfigForFileSpy;
  // eslint-disable-next-line @typescript-eslint/unbound-method
  eslintInstance._originalLintText = eslintInstance.lintText;
  eslintInstance.lintText = mockLintTextSpy;
  return eslintInstance;
}

MockedESLint.prototype = Object.create(ActualESLint.prototype) as ESLint_;

/**
 * @throws If `throwError` is specifically set on the spy, or if the filePath is
 *   not handled
 */
// eslint-disable-next-line @typescript-eslint/require-await
async function mockCalculateConfigForFile(
  filePath: string,
): Promise<ESLintConfig> {
  if (
    'throwError' in mockCalculateConfigForFileSpy &&
    mockCalculateConfigForFileSpy.throwError instanceof Error
  ) {
    throw mockCalculateConfigForFileSpy.throwError;
  }
  if (!filePath) {
    return {
      rules: {},
    };
  }
  if (filePath.includes('default-config')) {
    return {
      rules: {
        semi: [2, 'never'],
        'max-len': [2, 120, 2],
        indent: [2, 2, { SwitchCase: 1 }],
        quotes: [
          2,
          'single',
          { avoidEscape: true, allowTemplateLiterals: true },
        ],
        'comma-dangle': [
          2,
          {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            functions: 'always-multiline',
          },
        ],
        'arrow-parens': [2, 'as-needed'],
      },
    };
  }
  if (filePath.includes('fixtures/paths')) {
    return { rules: {} };
  }
  throw new Error(
    `Your mock filePath (${filePath})` +
      ' does not have a handler for finding the config',
  );
}

function mockLintText(this: MockESLint, ...args: Parameters<ESLintLintText>) {
  if (
    'throwError' in mockLintTextSpy &&
    mockLintTextSpy.throwError instanceof Error
  ) {
    throw mockLintTextSpy.throwError;
  }
  return this._originalLintText(...args);
}
