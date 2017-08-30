/* eslint no-console:0, import/default:0 */
import path from 'path'
import fsMock from 'fs'
import stripIndent from 'strip-indent'
import eslintMock from 'eslint'
import prettierMock from 'prettier'
import loglevelMock from 'loglevel-colored-level-prefix'
import format from '../'

jest.mock('fs')

const {mock: {logger}} = loglevelMock
// loglevelMock.mock.logThings = ['debug']

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
    // this one's actually hard to test now. This test doesn't
    // really do too much. Before, when prettier didn't support
    // semi, it was easy to tell based on the presence of the
    // semicolon. Now prettier removes the semicolon so I'm
    // honestly not sure how to test that prettier fixed
    // something that eslint fixed
    title: 'with prettierLast: true',
    input: {
      text: defaultInputText(),
      filePath: path.resolve('./mock/default-config'),
      prettierLast: true,
    },
    output: prettierLastOutput(),
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
    title: 'with a default config and overrides',
    input: {
      text: 'const { foo } = bar;',
      eslintConfig: {
        foo: true,
        // Won't be overridden
        parserOptions: {
          ecmaVersion: 7,
        },
        rules: {
          // Will be overridden
          semi: ['error', 'always'],
          // Won't be overridden
          'object-curly-spacing': ['error', 'never'],
        },
      },
      filePath: path.resolve('./mock/default-config'),
    },
    output: 'const {foo} = bar',
  },
  {
    title: 'with an empty config and fallbacks',
    input: {
      text: 'const { foo } = bar;',
      eslintConfig: {},
      filePath: path.resolve('./mock/default-config'),
      fallbackPrettierOptions: {bracketSpacing: false},
    },
    output: 'const {foo} = bar',
  },
  {
    title: 'without a filePath and no config',
    input: {text: defaultInputText()},
    output: noopOutput(),
  },
  {
    title: 'inferring bracketSpacing',
    input: {
      text: 'var foo = {bar: baz};',
      eslintConfig: {rules: {'object-curly-spacing': ['error', 'always']}},
    },
    output: 'var foo = { bar: baz };',
  },
  {
    title: 'inferring bracketSpacing with eslint object-curly-spacing options',
    input: {
      text: 'var foo = {bar: {baz: qux}};\nvar fop = {bar: [1, 2, 3]};',
      eslintConfig: {
        rules: {
          'object-curly-spacing': [
            'error',
            'always',
            {objectsInObjects: false, arraysInObjects: false},
          ],
        },
      },
    },
    output: 'var foo = { bar: { baz: qux }};\nvar fop = { bar: [1, 2, 3]};',
  },
  {
    title: 'with a filePath-aware config',
    input: {
      text: 'var x = 0;',
      eslintConfig: {
        rules: {'no-var': 'error'},
        ignorePattern: 'should-be-ignored',
      },
      filePath: 'should-be-ignored',
    },
    output: 'var x = 0;',
  },
  // if you have a bug report or something,
  // go ahead and add a test case here
  {
    title: 'with code that needs no fixing',
    input: {
      text: 'var [foo, { bar }] = window.APP;',
      eslintConfig: {rules: {}},
    },
    output: 'var [foo, { bar }] = window.APP;',
  },
  {
    title: 'CSS example',
    input: {
      text: '.stop{color:red};',
      filePath: path.resolve('./test.css'),
    },
    output: '.stop {\n  color: red;\n}',
  },
  {
    title: 'LESS example',
    input: {
      text: '.stop{color:red};',
      filePath: path.resolve('./test.less'),
    },
    output: '.stop {\n  color: red;\n}',
  },
  {
    title: 'SCSS example',
    input: {
      text: '.stop{color:red};',
      filePath: path.resolve('./test.scss'),
    },
    output: '.stop {\n  color: red;\n}',
  },
  {
    title: 'JSON example',
    input: {
      text: '{  "foo": "bar"}',
      filePath: path.resolve('./test.json'),
    },
    output: '{ "foo": "bar" }',
  },
  {
    title: 'TypeScript example',
    input: {
      text: 'function Foo (this: void) { return this; }',
      filePath: path.resolve('./test.ts'),
    },
    output: 'function Foo(this: void) {\n  return this;\n}',
  },
]

beforeEach(() => {
  eslintMock.mock.executeOnText.mockClear()
  eslintMock.mock.getConfigForFile.mockClear()
  prettierMock.format.mockClear()
  prettierMock.resolveConfig.mockClear()
  fsMock.readFileSync.mockClear()
  loglevelMock.mock.clearAll()
  global.__PRETTIER_ESLINT_TEST_STATE__ = {}
})

tests.forEach(({title, modifier, input, output}) => {
  let fn = test
  if (modifier) {
    fn = test[modifier]
  }
  fn(title, async () => {
    input.text = stripIndent(input.text).trim()
    const expected = stripIndent(output).trim()
    const actual = await format(input)
    // adding the newline in the expected because
    // prettier adds a newline to the end of the input
    expect(actual).toBe(`${expected}\n`)
  })
})

test('failure to fix with eslint throws and logs an error', async () => {
  const {executeOnText} = eslintMock.mock
  const error = new Error('Something happened')
  executeOnText.throwError = error
  const errorThrown = await format({text: ''}).catch(e => e)
  executeOnText.throwError = null

  expect(errorThrown).toBe(error)
  expect(logger.error).toHaveBeenCalledTimes(1)
})

test('logLevel is used to configure the logger', async () => {
  logger.setLevel = jest.fn()
  await format({text: '', logLevel: 'silent'})
  expect(logger.setLevel).toHaveBeenCalledTimes(1)
  expect(logger.setLevel).toHaveBeenCalledWith('silent')
})

test(`when prettier throws, log to logger.error and throw the error`, async () => {
  const error = new Error('something bad happened')
  prettierMock.format.throwError = error
  const errorThrown = await format({text: ''}).catch(e => e)
  prettierMock.format.throwError = null

  expect(errorThrown).toBe(error)
  expect(logger.error).toHaveBeenCalledTimes(1)
})

test('can accept a path to an eslint module and uses that instead.', async () => {
  const eslintPath = path.join(__dirname, '../__mocks__/eslint')
  await format({text: '', eslintPath})
  expect(eslintMock.mock.executeOnText).toHaveBeenCalledTimes(1)
})

test('fails with an error if the eslint module cannot be resolved.', async () => {
  const eslintPath = path.join(
    __dirname,
    '../__mocks__/non-existant-eslint-module',
  )

  const error = await format({text: '', eslintPath}).catch(e => e)

  expect(error.message).toMatch(/non-existant-eslint-module/)
  expect(logger.error).toHaveBeenCalledTimes(1)

  const errorString = expect.stringMatching(
    /trouble getting.*?eslint.*non-existant-eslint-module/,
  )

  expect(logger.error).toHaveBeenCalledWith(errorString)
})

test('can accept a path to a prettier module and uses that instead.', async () => {
  const prettierPath = path.join(__dirname, '../__mocks__/prettier')
  await format({text: '', prettierPath})
  expect(prettierMock.format).toHaveBeenCalledTimes(1)
})

test('fails with an error if the prettier module cannot be resolved.', async () => {
  const prettierPath = path.join(
    __dirname,
    '../__mocks__/non-existant-prettier-module',
  )
  const error = await format({text: '', prettierPath}).catch(e => e)
  expect(error.message).toMatch(/non-existant-prettier-module/)
  expect(logger.error).toHaveBeenCalledTimes(1)
  const errorString = expect.stringMatching(/trouble getting.*prettier/)
  expect(logger.error).toHaveBeenCalledWith(errorString)
})

test('resolves to the eslint module relative to the given filePath', async () => {
  const filePath = require.resolve('../../tests/fixtures/paths/foo.js')
  await format({text: '', filePath})
  const stateObj = {
    eslintPath: require.resolve(
      '../../tests/fixtures/paths/node_modules/eslint/index.js',
    ),
    prettierPath: require.resolve(
      '../../tests/fixtures/paths/node_modules/prettier/index.js',
    ),
  }
  expect(global.__PRETTIER_ESLINT_TEST_STATE__).toMatchObject(stateObj)
})

test('resolves to the local eslint module', async () => {
  const filePath = '/blah-blah/default-config'
  await format({text: '', filePath})
  expect(global.__PRETTIER_ESLINT_TEST_STATE__).toMatchObject({
    // without Jest's mocking, these would actually resolve to the
    // project modules :) The fact that jest's mocking is being
    // applied is good enough for this test.
    eslintPath: require.resolve('../__mocks__/eslint'),
    prettierPath: require.resolve('../__mocks__/prettier'),
  })
})

test('reads text from fs if filePath is provided but not text', async () => {
  const filePath = '/blah-blah/some-file.js'
  await format({filePath}).catch(() => {})
  // one hit to get the file and one for the eslintignore
  expect(fsMock.readFileSync).toHaveBeenCalledTimes(2)
  expect(fsMock.readFileSync).toHaveBeenCalledWith(filePath, 'utf8')
})

test('logs error if it cannot read the file from the filePath', async () => {
  const originalMock = fsMock.readFileSync
  fsMock.readFileSync = jest.fn(() => {
    throw new Error('some error')
  })
  const error = await format({filePath: '/some-path.js'}).catch(e => e)
  expect(error.message).toMatch(/some error/)
  expect(logger.error).toHaveBeenCalledTimes(1)
  fsMock.readFileSync = originalMock
})

test('calls prettier.resolveConfig with the file path', async () => {
  const filePath = require.resolve('../../tests/fixtures/paths/foo.js')
  await format({
    filePath,
    text: defaultInputText(),
    eslintConfig: getESLintConfigWithDefaultRules(),
  })
  expect(prettierMock.resolveConfig).toHaveBeenCalledTimes(1)
  expect(prettierMock.resolveConfig).toHaveBeenCalledWith(filePath)
})

test('logs if there is a problem making the CLIEngine', async () => {
  const error = new Error('fake error')
  eslintMock.CLIEngine.mockImplementation(() => {
    throw error
  })
  const errorThrown = await format({text: ''}).catch(e => e)
  eslintMock.CLIEngine.mockReset()
  expect(errorThrown).toBe(error)
  expect(logger.error).toHaveBeenCalledTimes(1)
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

function noopOutput() {
  return `
    function foo() {
      // stuff
      console.log("Hello world!", and, stuff);
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

function prettierLastOutput() {
  return `
    function foo() {
      // stuff
      console.log('Hello world!', and, stuff)
    }
  `
}
