import { vi } from 'vitest';

// this mock file is so eslint doesn't attempt to actually
// search around the file system for stuff

const eslintActual = await vi.importActual('eslint');
const { ESLint } = eslintActual;

// eslint-disable-next-line complexity
function mockCalculateConfigForFile(filePath) {
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
  } else if (filePath.includes('fixtures/paths')) {
    return { rules: {} };
  } else {
    throw new Error(
      `Your mock filePath (${filePath})` +
        ' does not have a handler for finding the config',
    );
  }
}

const mockLintTextSpy = vi.fn(function mockLintText(...args) {
  /* eslint no-invalid-this:0 */
  if (mockLintTextSpy.throwError) {
    throw mockLintTextSpy.throwError;
  }
  return this._originalLintText(...args);
});

const calculateConfigForFileSpy = vi.spyOn(ESLint.prototype, 'calculateConfigForFile').mockImplementation(mockCalculateConfigForFile);
const lintTextSpy = vi.spyOn(ESLint.prototype, 'lintText');

function MockESLint(...args) {
  global.__PRETTIER_ESLINT_TEST_STATE__.eslintPath = __filename;
  return new ESLint(...args);
}

export default {
  ...eslintActual.default,
  ESLint: vi.fn(MockESLint),
};

export const helpers = {
  getCalculateConfigForFileSpy: () => calculateConfigForFileSpy,
  getLintTextSpy: () => lintTextSpy,
};
