/* eslint no-console:0 */
import stripIndent from 'strip-indent'
import eslintMock from 'eslint'
import prettierMock from 'prettier'
import format from './' // eslint-disable-line import/default

console.error = jest.fn()

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
    title: 'with a filePath and no config',
    input: {
      text: defaultInputText(),
      filePath: '/mock/default-config',
    },
    output: defaultOutput(),
  },
  {
    title: 'without a filePath and no config',
    input: {
      text: defaultInputText(),
    },
    output: defaultOutput(),
  },
  // if you have a bug report or something,
  // go ahead and add a test case here
]

beforeEach(() => {
  console.error.mockClear()
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
  getConfigForFile.throwError = new Error('Something happened')
  format({text: ''})
  expect(console.error).toHaveBeenCalledTimes(1)
  getConfigForFile.throwError = null
})

test('failure to fix with eslint results in a console.error call', () => {
  const {executeOnText} = eslintMock.mock
  executeOnText.throwError = new Error('Something happened')
  format({text: ''})
  expect(console.error).toHaveBeenCalledTimes(1)
  executeOnText.throwError = null
})

test('console.error will not be called if disableLog is set', () => {
  format.options.disableLog = true

  const {getConfigForFile} = eslintMock.mock
  getConfigForFile.throwError = new Error('Something happened')
  format({text: ''})
  expect(console.error).toHaveBeenCalledTimes(0)

  format.options.disableLog = false
  getConfigForFile.throwError = null
})

test(`when prettier throws, log to console.error but don't fail`, () => {
  const {format: prettierMockFormat} = prettierMock
  prettierMockFormat.throwError = new Error('something bad happened')

  format({text: ''})
  expect(console.error).toHaveBeenCalledTimes(1)

  prettierMockFormat.throwError = null
})

function getESLintConfigWithDefaultRules(overrides) {
  return {
    rules: {
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
