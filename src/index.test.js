/* eslint no-console:0, import/default:0 */
import path from 'path'
import stripIndent from 'strip-indent'
import eslintMock from 'eslint'
import prettierMock from 'prettier'
import format from './'

console.error = jest.fn()
console.log = jest.fn()
console.dir = jest.fn()

const tests = [
  {
    title: 'sanity test',
    input: {
      text: defaultInputText(),
      eslintConfig: getESLintConfigWithDefaultRules(),
    },
    output: defaultOutput(),
  },
  {
    title: 'README example',
    input: {
      text: 'const {foo} = bar',
      eslintConfig: {
        parserOptions: {ecmaVersion: 7},
        rules: {semi: ['error', 'never']},
      },
      prettierOptions: {bracketSpacing: true},
    },
    output: 'const { foo } = bar',
  },
  {
    title: 'with a filePath and no config',
    input: {
      text: defaultInputText(),
      filePath: path.resolve('./mock/default-config'),
    },
    output: defaultOutput(),
  },
  {
    title: 'without a filePath and no config',
    input: {text: defaultInputText()},
    output: defaultOutput(),
  },
  // if you have a bug report or something,
  // go ahead and add a test case here
  {
    title: 'with code that needs no fixing',
    input: {text: 'var [foo, {bar}] = window.APP;', eslintConfig: {rules: {}}},
    output: 'var [foo, {bar}] = window.APP;',
  },
]

beforeEach(() => {
  console.error.mockClear()
  console.log.mockClear()
  console.dir.mockClear()
  eslintMock.mock.executeOnText.mockClear()
  eslintMock.mock.getConfigForFile.mockClear()
  prettierMock.format.mockClear()
  global.__PRETTIER_ESLINT_TEST_STATE__ = {}
})

tests.forEach(({title, modifier, input, output}) => {
  let fn = test
  if (modifier) {
    fn = test[modifier]
  }
  fn(title, () => {
    input.text = stripIndent(input.text).trim()
    const expected = stripIndent(output).trim()
    const actual = format(input)
    // adding the newline in the expected because
    // prettier adds a newline to the end of the input
    expect(actual).toBe(`${expected}\n`)
  })
})

test('failure to get the config results in a console.error call', () => {
  const {getConfigForFile} = eslintMock.mock
  const error = 'Something happened'
  getConfigForFile.throwError = new Error(error)
  expect(() => format({text: ''})).toThrowError(error)
  expect(console.error).toHaveBeenCalledTimes(1)
  getConfigForFile.throwError = null
})

test('failure to fix with eslint results in a console.error call', () => {
  const {executeOnText} = eslintMock.mock
  const error = 'Something happened'
  executeOnText.throwError = new Error(error)
  expect(() => format({text: ''})).toThrowError(error)
  expect(console.error).toHaveBeenCalledTimes(1)
  executeOnText.throwError = null
})

test('console.error will not be called if disableLog is set', () => {
  format.options.disableLog = true

  const {getConfigForFile} = eslintMock.mock
  const error = 'Something happened'
  getConfigForFile.throwError = new Error(error)
  expect(() => format({text: ''})).toThrowError(error)
  expect(console.error).toHaveBeenCalledTimes(0)

  format.options.disableLog = false
  getConfigForFile.throwError = null
})

test('console receives silly output when sillyLogs is set', () => {
  format.options.sillyLogs = true
  format({text: ''})
  const sillyOutput = 'silly logs for eslintConfig and prettierOptions:'
  expect(console.log).toHaveBeenCalledWith(sillyOutput)
  expect(console.log).toHaveBeenCalledTimes(1)
  const dirObj = expect.objectContaining({
    eslintConfig: expect.objectContaining({}),
    prettierOptions: expect.objectContaining({}),
  })
  const options = {depth: null, colors: true}
  expect(console.dir).toHaveBeenCalledWith(dirObj, options)
  expect(console.dir).toHaveBeenCalledTimes(1)

  format.options.sillyLogs = false
})

test(`when prettier throws, log to console.error but don't fail`, () => {
  const {format: prettierMockFormat} = prettierMock
  const error = 'something bad happened'
  prettierMockFormat.throwError = new Error(error)

  expect(() => format({text: ''})).toThrowError(error)
  expect(console.error).toHaveBeenCalledTimes(1)

  prettierMockFormat.throwError = null
})

test('can disable log on a single call as part of the options', () => {
  const {format: prettierMockFormat} = prettierMock
  const error = 'something bad happened'
  prettierMockFormat.throwError = new Error(error)

  expect(() => format({text: '', disableLog: true})).toThrowError(error)
  expect(console.error).toHaveBeenCalledTimes(0)
  expect(() => format({text: ''})).toThrowError(error)
  expect(console.error).toHaveBeenCalledTimes(1)

  prettierMockFormat.throwError = null
})

test('can accept a path to an eslint module and uses that instead.', () => {
  const eslintPath = path.join(__dirname, './__mocks__/eslint')
  const {executeOnText} = eslintMock.mock
  format({text: '', eslintPath})
  expect(executeOnText).toHaveBeenCalledTimes(1)
})

test('fails with an error if the eslint module cannot be resolved.', () => {
  const eslintPath = path.join(
    __dirname,
    './__mocks__/non-existant-eslint-module',
  )

  expect(() => format({text: '', eslintPath})).toThrowError(
    /non-existant-eslint-module/,
  )
  expect(console.error).toHaveBeenCalledTimes(1)

  const errorString = expect.stringMatching(
    /ESLint.*?eslintPath.*non-existant-eslint-module/,
  )

  expect(console.error).toHaveBeenCalledWith(
    'prettier-eslint error:',
    errorString,
  )
})

test('can accept a path to a prettier module and uses that instead.', () => {
  const prettierPath = path.join(__dirname, './__mocks__/prettier')
  const {format: prettierMockFormat} = prettierMock
  format({text: '', prettierPath})
  expect(prettierMockFormat).toHaveBeenCalledTimes(1)
})

test('fails with an error if the prettier module cannot be resolved.', () => {
  const prettierPath = path.join(
    __dirname,
    './__mocks__/non-existant-prettier-module',
  )
  expect(() => format({text: '', prettierPath})).toThrowError(
    /non-existant-prettier-module/,
  )
  expect(console.error).toHaveBeenCalledTimes(1)
  const errorString = expect.stringMatching(
    /prettier.*?prettierPath.*non-existant-prettier-module/,
  )
  expect(console.error).toHaveBeenCalledWith(
    'prettier-eslint error:',
    errorString,
  )
})

test('resolves to the eslint module relative to the given filePath', () => {
  const filePath = require.resolve('../tests/fixtures/paths/foo.js')
  format({text: '', filePath})
  const stateObj = {
    eslintPath: require.resolve(
      '../tests/fixtures/paths/node_modules/eslint/index.js',
    ),
    prettierPath: require.resolve(
      '../tests/fixtures/paths/node_modules/prettier/index.js',
    ),
  }
  expect(global.__PRETTIER_ESLINT_TEST_STATE__).toMatchObject(stateObj)
})

test('resolves to the local eslint module', () => {
  const filePath = '/blah-blah/default-config'
  format({text: '', filePath})
  expect(global.__PRETTIER_ESLINT_TEST_STATE__).toMatchObject({
    // without Jest's mocking, these would actually resolve to the
    // project modules :) The fact that jest's mocking is being
    // applied is good enough for this test.
    eslintPath: require.resolve('./__mocks__/eslint'),
    prettierPath: require.resolve('./__mocks__/prettier'),
  })
})

function getESLintConfigWithDefaultRules(overrides) {
  return {
    parserOptions: {ecmaVersion: 7},
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
      ...overrides,
    },
  }
}

function defaultInputText() {
  return `
    function  foo (){ // stuff
      console.log( "Hello world!",  and, stuff );
    }
  `
}

function defaultOutput() {
  return `
    function foo() {
      // stuff
      console.log('Hello world!', and, stuff)
    }
  `
}
