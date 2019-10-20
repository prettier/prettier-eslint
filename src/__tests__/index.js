/* eslint no-console:0, import/default:0 */
import path from 'path';
import fsMock from 'fs';
import stripIndent from 'strip-indent';
import eslintMock from 'eslint';
import prettierMock from 'prettier';
import loglevelMock from 'loglevel-colored-level-prefix';
import format from '../';

jest.mock('fs');

const {
  mock: { logger }
} = loglevelMock;
// loglevelMock.mock.logThings = ['debug']

const tests = [
  {
    title: 'sanity test',
    input: {
      text: defaultInputText(),
      eslintConfig: getESLintConfigWithDefaultRules()
    },
    output: defaultOutput()
  },
  {
    title: 'README example',
    input: {
      text: 'const {foo} = bar',
      eslintConfig: {
        parserOptions: { ecmaVersion: 7 },
        rules: { semi: ['error', 'never'] }
      },
      prettierOptions: { bracketSpacing: true }
    },
    output: 'const { foo } = bar'
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
      filePath: path.resolve('./mock/default-config.js'),
      prettierLast: true
    },
    output: prettierLastOutput()
  },
  {
    title: 'with a filePath and no config',
    input: {
      text: defaultInputText(),
      filePath: path.resolve('./mock/default-config.js')
    },
    output: defaultOutput()
  },
  {
    title: 'with a default config and overrides',
    input: {
      text: 'const { foo } = bar;',
      eslintConfig: {
        foo: true,
        // Won't be overridden
        parserOptions: {
          ecmaVersion: 7
        },
        rules: {
          // Will be overridden
          semi: ['error', 'always'],
          // Won't be overridden
          'object-curly-spacing': ['error', 'never']
        }
      },
      filePath: path.resolve('./mock/default-config.js')
    },
    output: 'const {foo} = bar'
  },
  {
    title: 'with an empty config and fallbacks',
    input: {
      text: 'const { foo } = bar;',
      eslintConfig: {},
      filePath: path.resolve('./mock/default-config.js'),
      fallbackPrettierOptions: { bracketSpacing: false }
    },
    output: 'const {foo} = bar'
  },
  {
    title: 'without a filePath and no config',
    input: { text: defaultInputText() },
    output: noopOutput()
  },
  {
    title: 'inferring bracketSpacing',
    input: {
      text: 'var foo = {bar: baz};',
      eslintConfig: { rules: { 'object-curly-spacing': ['error', 'always'] } }
    },
    output: 'var foo = { bar: baz };'
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
            { objectsInObjects: false, arraysInObjects: false }
          ]
        }
      }
    },
    output: 'var foo = { bar: { baz: qux }};\nvar fop = { bar: [1, 2, 3]};'
  },
  {
    title: 'with a filePath-aware config',
    input: {
      text: 'var x = 0;',
      eslintConfig: {
        rules: { 'no-var': 'error' },
        ignorePattern: 'should-be-ignored'
      },
      filePath: 'should-be-ignored.js'
    },
    output: 'var x = 0;'
  },
  // if you have a bug report or something,
  // go ahead and add a test case here
  {
    title: 'with code that needs no fixing',
    input: {
      text: 'var [foo, { bar }] = window.APP;',
      eslintConfig: { rules: {} }
    },
    output: 'var [foo, { bar }] = window.APP;'
  },
  {
    title: 'CSS example',
    input: {
      text: '.stop{color:red};',
      filePath: path.resolve('./test.css')
    },
    output: '.stop {\n  color: red;\n}'
  },
  {
    title: 'LESS example',
    input: {
      text: '.stop{color:red};',
      filePath: path.resolve('./test.less')
    },
    output: '.stop {\n  color: red;\n}'
  },
  {
    title: 'SCSS example',
    input: {
      text: '.stop{color:red};',
      filePath: path.resolve('./test.scss')
    },
    output: '.stop {\n  color: red;\n}'
  },
  {
    title: 'TypeScript example',
    input: {
      text: 'function Foo (this: void) { return this; }',
      filePath: path.resolve('./test.ts')
    },
    output: 'function Foo(this: void) {\n  return this;\n}'
  },
  {
    title: 'Vue.js example',
    input: {
      eslintConfig: {
        rules: {
          'space-before-function-paren': [2, 'always']
        }
      },
      text:
        '<template>\n  <div></div>\n</template>\n<script>\nfunction foo() { return "foo" }\n</script>\n<style>\n</style>',
      filePath: path.resolve('./test.vue')
    },
    output:
      '<template>\n  <div></div>\n</template>\n<script>\nfunction foo () {\n  return "foo";\n}\n</script>\n<style></style>'
  },
  {
    title: 'GraphQL example',
    input: {
      text: 'type Query{test: Test}',
      filePath: path.resolve('./test.gql')
    },
    output: 'type Query {\n  test: Test\n}'
  },
  {
    title: 'JSON example',
    input: {
      text: '{  "foo": "bar"}',
      filePath: path.resolve('./test.json')
    },
    output: '{ "foo": "bar" }'
  },
  {
    title: 'Markdown example',
    input: {
      text: '#   Foo\n _bar_',
      filePath: path.resolve('./test.md')
    },
    output: '# Foo\n\n_bar_'
  },
  {
    title: 'Test eslintConfig.globals as an object',
    input: {
      text: 'var foo = {  "bar": "baz"}',
      eslintConfig: {
        globals: {
          someGlobal: true
        }
      }
    },
    output: 'var foo = { bar: "baz" };'
  }
];

beforeEach(() => {
  eslintMock.mock.executeOnText.mockClear();
  eslintMock.mock.getConfigForFile.mockClear();
  prettierMock.format.mockClear();
  prettierMock.resolveConfig.sync.mockClear();
  fsMock.readFileSync.mockClear();
  loglevelMock.mock.clearAll();
  global.__PRETTIER_ESLINT_TEST_STATE__ = {};
});

tests.forEach(({ title, modifier, input, output }) => {
  let fn = test;
  if (modifier) {
    fn = test[modifier];
  }
  fn(title, () => {
    input.text = stripIndent(input.text).trim();
    const expected = stripIndent(output).trim();
    const actual = format(input);
    // adding the newline in the expected because
    // prettier adds a newline to the end of the input
    expect(actual).toBe(`${expected}\n`);
  });
});

test('failure to fix with eslint throws and logs an error', () => {
  const { executeOnText } = eslintMock.mock;
  const error = new Error('Something happened');
  executeOnText.throwError = error;

  expect(() => format({ text: '' })).toThrowError(error);
  expect(logger.error).toHaveBeenCalledTimes(1);
  executeOnText.throwError = null;
});

test('logLevel is used to configure the logger', () => {
  logger.setLevel = jest.fn();
  format({ text: '', logLevel: 'silent' });
  expect(logger.setLevel).toHaveBeenCalledTimes(1);
  expect(logger.setLevel).toHaveBeenCalledWith('silent');
});

test(`when prettier throws, log to logger.error and throw the error`, () => {
  const error = new Error('something bad happened');
  prettierMock.format.throwError = error;

  expect(() => format({ text: '' })).toThrowError(error);
  expect(logger.error).toHaveBeenCalledTimes(1);
  prettierMock.format.throwError = null;
});

test('can accept a path to an eslint module and uses that instead.', () => {
  const eslintPath = path.join(__dirname, '../__mocks__/eslint');
  format({ text: '', eslintPath });
  expect(eslintMock.mock.executeOnText).toHaveBeenCalledTimes(1);
});

test('fails with an error if the eslint module cannot be resolved.', () => {
  const eslintPath = path.join(
    __dirname,
    '../__mocks__/non-existent-eslint-module'
  );

  expect(() => format({ text: '', eslintPath })).toThrowError(
    /non-existent-eslint-module/
  );
  expect(logger.error).toHaveBeenCalledTimes(1);

  const errorString = expect.stringMatching(
    /trouble getting.*?eslint.*non-existent-eslint-module/
  );

  expect(logger.error).toHaveBeenCalledWith(errorString);
});

test('can accept a path to a prettier module and uses that instead.', () => {
  const prettierPath = path.join(__dirname, '../__mocks__/prettier');
  format({ text: '', prettierPath });
  expect(prettierMock.format).toHaveBeenCalledTimes(1);
});

test('fails with an error if the prettier module cannot be resolved.', () => {
  const prettierPath = path.join(
    __dirname,
    '../__mocks__/non-existent-prettier-module'
  );

  expect(() => format({ text: '', prettierPath })).toThrowError(
    /non-existent-prettier-module/
  );
  expect(logger.error).toHaveBeenCalledTimes(1);
  const errorString = expect.stringMatching(
    /trouble getting.*?eslint.*non-existent-prettier-module/
  );
  expect(logger.error).toHaveBeenCalledWith(errorString);
});

test('resolves to the eslint module relative to the given filePath', () => {
  const filePath = require.resolve('../../tests/fixtures/paths/foo.js');
  format({ text: '', filePath });
  const stateObj = {
    eslintPath: require.resolve(
      '../../tests/fixtures/paths/node_modules/eslint/index.js'
    ),
    prettierPath: require.resolve(
      '../../tests/fixtures/paths/node_modules/prettier/index.js'
    )
  };
  expect(global.__PRETTIER_ESLINT_TEST_STATE__).toMatchObject(stateObj);
});

test('resolves to the local eslint module', () => {
  const filePath = '/blah-blah/default-config.js';
  format({ text: '', filePath });
  expect(global.__PRETTIER_ESLINT_TEST_STATE__).toMatchObject({
    // without Jest's mocking, these would actually resolve to the
    // project modules :) The fact that jest's mocking is being
    // applied is good enough for this test.
    eslintPath: require.resolve('../__mocks__/eslint'),
    prettierPath: require.resolve('../__mocks__/prettier')
  });
});

test('reads text from fs if filePath is provided but not text', () => {
  const filePath = '/blah-blah/some-file.js';
  format({ filePath });
  // format({filePath}).catch(() => {})
  // one hit to get the file and one for the eslintignore
  expect(fsMock.readFileSync).toHaveBeenCalledTimes(3);
  expect(fsMock.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
  const eslintIgnoreCall  = fsMock.readFileSync.mock.calls[1][0];
  expect(eslintIgnoreCall.includes('.eslintignore')).toBeTruthy();
});

test('logs error if it cannot read the file from the filePath', () => {
  const originalMock = fsMock.readFileSync;
  fsMock.readFileSync = jest.fn(() => {
    throw new Error('some error');
  });
  expect(() => format({ filePath: '/some-path.js' })).toThrowError(
    /some error/
  );
  expect(logger.error).toHaveBeenCalledTimes(1);
  fsMock.readFileSync = originalMock;
});

test('calls prettier.resolveConfig.sync with the file path', () => {
  const filePath = require.resolve('../../tests/fixtures/paths/foo.js');
  format({
    filePath,
    text: defaultInputText(),
    eslintConfig: getESLintConfigWithDefaultRules()
  });
  expect(prettierMock.resolveConfig.sync).toHaveBeenCalledTimes(1);
  expect(prettierMock.resolveConfig.sync).toHaveBeenCalledWith(filePath);
});

test('does not raise an error if prettier.resolveConfig.sync is not defined', () => {
  const filePath = require.resolve('../../tests/fixtures/paths/foo.js');
  const originalPrettierMockResolveConfigSync = prettierMock.resolveConfig.sync;
  prettierMock.resolveConfig.sync = undefined;

  function callingFormat() {
    return format({
      filePath,
      text: defaultInputText(),
      eslintConfig: getESLintConfigWithDefaultRules()
    });
  }

  expect(callingFormat).not.toThrowError();

  prettierMock.resolveConfig.sync = originalPrettierMockResolveConfigSync;
});

test('does not raise an error if prettier.resolveConfig is not defined', () => {
  const filePath = require.resolve('../../tests/fixtures/paths/foo.js');
  const originalPrettierMockResolveConfig = prettierMock.resolveConfig;
  prettierMock.resolveConfig = undefined;

  function callingFormat() {
    return format({
      filePath,
      text: defaultInputText(),
      eslintConfig: getESLintConfigWithDefaultRules()
    });
  }

  expect(callingFormat).not.toThrowError();

  prettierMock.resolveConfig = originalPrettierMockResolveConfig;
});

test('logs if there is a problem making the CLIEngine', () => {
  const error = new Error('fake error');
  eslintMock.CLIEngine.mockImplementation(() => {
    throw error;
  });
  expect(() => format({ text: '' })).toThrowError(error);
  eslintMock.CLIEngine.mockReset();
  expect(logger.error).toHaveBeenCalledTimes(1);
});

function getESLintConfigWithDefaultRules(overrides) {
  return {
    parserOptions: { ecmaVersion: 7 },
    rules: {
      semi: [2, 'never'],
      'max-len': [2, 120, 2],
      indent: [2, 2, { SwitchCase: 1 }],
      quotes: [2, 'single', { avoidEscape: true, allowTemplateLiterals: true }],
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
      'arrow-parens': [2, 'as-needed'],
      ...overrides
    }
  };
}

function defaultInputText() {
  return `
    function  foo (){ // stuff
      console.log( "Hello world!",  and, stuff );
    }
  `;
}

function noopOutput() {
  return `
    function foo() {
      // stuff
      console.log("Hello world!", and, stuff);
    }
  `;
}

function defaultOutput() {
  return `
    function foo() {
      // stuff
      console.log('Hello world!', and, stuff)
    }
  `;
}

function prettierLastOutput() {
  return `
    function foo() {
      // stuff
      console.log('Hello world!', and, stuff)
    }
  `;
}
