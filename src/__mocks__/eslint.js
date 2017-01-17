// this mock file is so eslint doesn't attempt to actually
// search around the filesystem for stuff

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
  CLIEngine.apply(this, args)
  this.getConfigForFile = mockGetConfigForFileSpy
  this._originalExecuteOnText = this.executeOnText
  this.executeOnText = mockExecuteOnTextSpy
}

MockCLIEngine.prototype = Object.create(CLIEngine.prototype)

function mockGetConfigForFile(filePath) {
  if (mockGetConfigForFileSpy.throwError) {
    throw mockGetConfigForFileSpy.throwError
  }
  if (!filePath) {
    filePath = '/mock/default-config'
  }
  return {
    '/mock/default-config': {
      rules: {
        semi: [2, 'never'],
        'max-len': [2, 120, 2],
        indent: [2, 2, {SwitchCase: 1}],
        quotes: [2, 'single', {avoidEscape: true, allowTemplateLiterals: true}],
        'comma-dangle': [2, {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'always-multiline',
        }],
        'arrow-parens': [2, 'as-needed'],
      },
    },
  }[filePath]
}

function mockExecuteOnText(...args) {
  /* eslint babel/no-invalid-this:0 */
  if (mockExecuteOnTextSpy.throwError) {
    throw mockExecuteOnTextSpy.throwError
  }
  return this._originalExecuteOnText(...args)
}
