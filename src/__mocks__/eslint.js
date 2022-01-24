// this mock file is so eslint doesn't attempt to actually
// search around the file system for stuff

const eslint = jest.requireActual('eslint');
const { ESLint } = eslint;

const mockCalculateConfigForFileSpy = jest.fn(mockCalculateConfigForFile);
mockCalculateConfigForFileSpy.overrides = {};
const mockLintTextSpy = jest.fn(mockLintText);

module.exports = Object.assign(eslint, {
  ESLint: jest.fn(MockESLint),
  mock: {
    calculateConfigForFile: mockCalculateConfigForFileSpy,
    lintText: mockLintTextSpy
  }
});

function MockESLint(...args) {
  global.__PRETTIER_ESLINT_TEST_STATE__.eslintPath = __filename;
  const eslintInstance = new ESLint(...args);
  eslintInstance.calculateConfigForFile = mockCalculateConfigForFileSpy;
  eslintInstance._originalLintText = eslintInstance.lintText;
  eslintInstance.lintText = mockLintTextSpy;
  return eslintInstance;
}

MockESLint.prototype = Object.create(ESLint.prototype);

// eslint-disable-next-line complexity
function mockCalculateConfigForFile(filePath) {
  if (mockCalculateConfigForFileSpy.throwError) {
    throw mockCalculateConfigForFileSpy.throwError;
  }
  if (!filePath) {
    return {
      rules: {}
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
          { avoidEscape: true, allowTemplateLiterals: true }
        ],
        'comma-dangle': [
          2,
          {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            functions: 'always-multiline'
          }
        ],
        'arrow-parens': [2, 'as-needed']
    }};
  } else if (filePath.includes('fixtures/paths')) {
    return { rules: {} };
  } else {
    throw new Error(
      `Your mock filePath (${filePath})` +
        ' does not have a handler for finding the config'
    );
  }
}

function mockLintText(...args) {
  /* eslint babel/no-invalid-this:0 */
  if (mockLintTextSpy.throwError) {
    throw mockLintTextSpy.throwError;
  }
  return this._originalLintText(...args);
}
