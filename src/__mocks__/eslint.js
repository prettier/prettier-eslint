// this mock file is so eslint doesn't attempt to actually
// search around the file system for stuff

const eslint = require.requireActual('eslint')
const {CLIEngine} = eslint

const mockGetConfigForFileSpy = jest.fn(mockGetConfigForFile)
mockGetConfigForFileSpy.overrides = {}
const mockExecuteOnTextSpy = jest.fn(mockExecuteOnText)

module.exports = Object.assign(eslint, {
  CLIEngine: MockCLIEngine,
  mock: {
    getConfigForFile: mockGetConfigForFileSpy,
    executeOnText: mockExecuteOnTextSpy,
  },
})

function MockCLIEngine(...args) {
  global.__PRETTIER_ESLINT_TEST_STATE__.eslintPath = __filename
  CLIEngine.apply(this, args)
  // not sure why, but in some cases, this.executeOnText is undefined...
  // so we create a fakeCLIEngine to get a copy of that function
  // and call it with apply :)
  const fakeCLIEngine = new CLIEngine(...args)
  this.getConfigForFile = mockGetConfigForFileSpy
  this._originalExecuteOnText = fakeCLIEngine.executeOnText
  this.executeOnText = mockExecuteOnTextSpy
}

MockCLIEngine.prototype = Object.create(CLIEngine.prototype)

function mockGetConfigForFile(filePath) {
  if (mockGetConfigForFileSpy.throwError) {
    throw mockGetConfigForFileSpy.throwError
  }
  if (!filePath) {
    return {
      rules: {},
    }
  }
  if (filePath.includes('default-config')) {
    return {
      rules: {
        semi: [2, 'never'],
        'max-len': [2, 120, 2],
        indent: [2, 2, {SwitchCase: 1}],
        quotes: [2, 'single', {avoidEscape: true, allowTemplateLiterals: true}],
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
    }
  } else if (filePath.includes('fixtures/paths')) {
    return {rules: {}}
  } else {
    throw new Error(
      `Your mock filePath (${filePath})` +
        ' does not have a handler for finding the config',
    )
  }
}

function mockExecuteOnText(...args) {
  /* eslint babel/no-invalid-this:0 */
  if (mockExecuteOnTextSpy.throwError) {
    throw mockExecuteOnTextSpy.throwError
  }
  return this._originalExecuteOnText(...args)
}
