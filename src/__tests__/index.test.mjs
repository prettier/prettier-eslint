/* eslint no-console:0, import/default:0 */
import path from 'node:path';
import requireRelative from 'require-relative';
import { beforeEach, expect, test, vi } from 'vitest';
import stripIndent from 'strip-indent';
import eslintMock, {
  helpers as eslintMockHelpers,
} from '../__mocks__/eslint.mjs';
import fsMock from '../__mocks__/fs.mjs';
import prettierMock from '../__mocks__/prettier.mjs';
import loglevelMock, {
  helpers as loglevelMockHelpers,
} from '../__mocks__/loglevel-colored-level-prefix';

// Mock eslint and prettier at their resolved locations.
//   vitest module mocking is keyed on the string passed to `import()`,
//   so we have to get the on-disk location right.
//   We use `doMock` to prevent their being hoisted above this test's
//   import statements, since they're dynamically imported.
//   https://vitest.dev/api/vi.html#vi-domock
vi.doMock(requireRelative.resolve('eslint'), () => {
  return { default: eslintMock };
});

vi.doMock(requireRelative.resolve('prettier'), () => {
  return { default: prettierMock };
});

// loglevel-colored-level-prefix is not a dynamic import
vi.mock('fs', () => {
  return { default: fsMock };
});
vi.mock('loglevel-colored-level-prefix', () => {
  return { default: loglevelMock };
});

import { format, analyze } from '../';

const logger = loglevelMockHelpers.getLogger();

beforeEach(() => {
  vi.clearAllMocks();
  global.__PRETTIER_ESLINT_TEST_STATE__ = {};
});

const formatTests = [
  {
    title: 'sanity test',
    options: {
      text: defaultInputText(),
      eslintConfig: getESLintConfigWithDefaultRules(),
    },
    output: defaultOutput(),
  },
  {
    title: 'README example',
    options: {
      text: 'const {foo} = bar',
      eslintConfig: {
        parserOptions: { ecmaVersion: 7 },
        rules: { semi: ['error', 'never'] },
      },
      prettierOptions: { bracketSpacing: true },
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
    options: {
      text: defaultInputText(),
      filePath: path.resolve('./mock/default-config.js'),
      prettierLast: true,
    },
    output: prettierLastOutput(),
  },
  {
    title: 'with a filePath and no config',
    options: {
      text: defaultInputText(),
      filePath: path.resolve('./mock/default-config.js'),
    },
    output: defaultOutput(),
  },
  {
    title: 'with a default config and overrides',
    options: {
      text: 'const { foo } = bar;',
      eslintConfig: {
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
      filePath: path.resolve('./mock/default-config.js'),
    },
    output: 'const {foo} = bar',
  },
  {
    title: 'with an empty config and fallbacks',
    options: {
      text: 'const { foo } = bar;',
      eslintConfig: {},
      filePath: path.resolve('./mock/default-config.js'),
      fallbackPrettierOptions: { bracketSpacing: false },
    },
    output: 'const {foo} = bar',
  },
  {
    title: 'without a filePath and no config',
    options: { text: defaultInputText() },
    output: noopOutput(),
  },
  {
    title: 'inferring bracketSpacing',
    options: {
      text: 'var foo = {bar: baz};',
      eslintConfig: { rules: { 'object-curly-spacing': ['error', 'always'] } },
    },
    output: 'var foo = { bar: baz };',
  },
  {
    title: 'inferring bracketSpacing with eslint object-curly-spacing options',
    options: {
      text: 'var foo = {bar: {baz: qux}};\nvar fop = {bar: [1, 2, 3]};',
      eslintConfig: {
        rules: {
          'object-curly-spacing': [
            'error',
            'always',
            { objectsInObjects: false, arraysInObjects: false },
          ],
        },
      },
    },
    output: 'var foo = { bar: { baz: qux }};\nvar fop = { bar: [1, 2, 3]};',
  },
  {
    title: 'inferring bracketSpacing with eslint object-curly-spacing options',
    options: {
      text: 'var foo = {bar: {baz: qux}};\nvar fop = {bar: [1, 2, 3]};',
      eslintConfig: {
        rules: {
          'object-curly-spacing': [
            'error',
            'always',
            { objectsInObjects: false, arraysInObjects: false },
          ],
        },
      },
    },
    output: 'var foo = { bar: { baz: qux }};\nvar fop = { bar: [1, 2, 3]};',
  },
  {
    title: 'with a filePath-aware config',
    options: {
      text: 'var x = 0;',
      eslintConfig: {
        rules: { 'no-var': 'error' },
        ignorePattern: 'should-be-ignored',
      },
      filePath: path.resolve('should-be-ignored.js'),
    },
    output: 'var x = 0;',
  },
  {
    // if you have a bug report or something,
    // go ahead and add a test case here
    title: 'with code that needs no fixing',
    options: {
      text: 'var [foo, { bar }] = window.APP;',
      eslintConfig: { rules: {} },
    },
    output: 'var [foo, { bar }] = window.APP;',
  },
  {
    title: 'accepts config globals as array',
    options: {
      text: defaultInputText(),
      eslintConfig: { globals: ['window:writable'] },
    },
    output: noopOutput(),
  },
  {
    title: 'CSS example',
    options: {
      text: '.stop{color:red};',
      filePath: path.resolve('./test.css'),
    },
    output: '.stop {\n  color: red;\n}',
  },
  {
    title: 'LESS example',
    options: {
      text: '.stop{color:red};',
      filePath: path.resolve('./test.less'),
    },
    output: '.stop {\n  color: red;\n}',
  },
  {
    title: 'SCSS example',
    options: {
      text: '.stop{color:red};',
      filePath: path.resolve('./test.scss'),
    },
    output: '.stop {\n  color: red;\n}',
  },
  {
    title: 'TypeScript example',
    options: {
      text: 'function Foo (this: void) { return this; }',
      filePath: path.resolve('./test.ts'),
    },
    output: 'function Foo(this: void) {\n  return this;\n}',
  },
  {
    title: 'Vue.js example',
    options: {
      eslintConfig: {
        rules: {
          'space-before-function-paren': [2, 'always'],
        },
      },
      text: '<template>\n  <div></div>\n</template>\n<script>\nfunction foo() { return "foo" }\n</script>\n<style>\n</style>',
      filePath: path.resolve('./test.vue'),
    },

    output:
      '<template>\n  <div></div>\n</template>\n<script>\nfunction foo () {\n  return "foo";\n}\n</script>\n<style></style>',
  },
  {
    title: 'Svelte example',
    options: {
      prettierOptions: {
        plugins: ['prettier-plugin-svelte'],
        overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
      },
      text: '<script>\nfunction foo() { return "foo" }\n</script>\n  <div>test</div>\n<style>\n</style>',
      filePath: path.resolve('./test.svelte'),
    },

    output:
      '<script>\n  function foo() {\n    return "foo";\n  }\n</script>\n\n<div>test</div>\n\n<style>\n</style>',
  },
  {
    title: 'GraphQL example',
    options: {
      text: 'type Query{test: Test}',
      filePath: path.resolve('./test.gql'),
    },
    output: 'type Query {\n  test: Test\n}',
  },
  {
    title: 'JSON example',
    options: {
      text: '{  "foo": "bar"}',
      filePath: path.resolve('./test.json'),
    },
    output: '{ "foo": "bar" }',
  },

  {
    title: 'Markdown example',
    options: {
      text: '#   Foo\n _bar_',
      filePath: path.resolve('./test.md'),
    },
    output: '# Foo\n\n_bar_',
  },

  {
    title: 'Test eslintConfig.globals as an object',
    options: {
      text: 'var foo = {  "bar": "baz"}',
      eslintConfig: {
        globals: {
          someGlobal: true,
        },
      },
    },
    output: 'var foo = { bar: "baz" };',
  },
];

test.for(formatTests)('format $title', async ({ options, output }) => {
  // A newline is added to the expected output to account
  // for prettier's behavior.
  const expected = `${stripIndent(output).trim()}\n`;
  const actual = await format({
    ...options,
    text: stripIndent(options.text).trim(),
  });

  expect(actual).toBe(expected);
});

test('analyze returns the messages', async () => {
  const text = 'var x = 0;';
  const result = await analyze({
    text,
    eslintConfig: {
      rules: { 'no-var': 'error' },
    },
  });
  expect(result.output).toBe(`${text}\n`);
  expect(result.messages).toHaveLength(1);
  const msg = result.messages[0];
  expect(msg.ruleId).toBe('no-var');
  expect(msg.column).toBe(1);
  expect(msg.endColumn).toBe(11);
});

test('failure to fix with eslint throws and logs an error', async () => {
  const lintText = eslintMockHelpers.getLintTextSpy();

  const error = new Error('Something happened');
  lintText.mockImplementationOnce(() => {
    throw error;
  });

  await expect(async () => await format({ text: '' })).rejects.toThrowError(
    error,
  );
  expect(logger.error).toHaveBeenCalledTimes(1);
});

test('logLevel is used to configure the logger', async () => {
  logger.setLevel = vi.fn();
  await format({ text: '', logLevel: 'silent' });
  expect(logger.setLevel).toHaveBeenCalledTimes(1);
  expect(logger.setLevel).toHaveBeenCalledWith('silent');
});

test('when prettier throws, log to logger.error and throw the error', async () => {
  const error = new Error('something bad happened');
  prettierMock.format.throwError = error;

  await expect(() => format({ text: '' })).rejects.toThrowError(error);
  expect(logger.error).toHaveBeenCalledTimes(1);
  prettierMock.format.throwError = null;
});

test('can accept a path to an eslint module and uses that instead.', async () => {
  const eslintPath = path.join(__dirname, '../__mocks__/eslint.mjs');
  await format({ text: '', eslintPath });
  expect(eslintMockHelpers.getLintTextSpy()).toHaveBeenCalledTimes(1);
});

test('fails with an error if the eslint module cannot be resolved.', async () => {
  const eslintPath = path.join(
    __dirname,
    '../__mocks__/non-existent-eslint-module',
  );

  await expect(() => format({ text: '', eslintPath })).rejects.toThrowError(
    /non-existent-eslint-module/,
  );
  expect(logger.error).toHaveBeenCalledTimes(1);

  const errorString = expect.stringMatching(
    /trouble getting.*?eslint.*non-existent-eslint-module/,
  );

  expect(logger.error).toHaveBeenCalledWith(errorString);
});

test('can accept a path to a prettier module and uses that instead.', async () => {
  const prettierPath = path.join(__dirname, '../__mocks__/prettier');
  await format({ text: '', prettierPath });

  expect(prettierMock.format).toHaveBeenCalledTimes(1);
});

test('fails with an error if the prettier module cannot be resolved.', async () => {
  const prettierPath = path.join(
    __dirname,
    '../__mocks__/non-existent-prettier-module',
  );

  await expect(() => format({ text: '', prettierPath })).rejects.toThrowError(
    /non-existent-prettier-module/,
  );
  expect(logger.error).toHaveBeenCalledTimes(1);
  const errorString = expect.stringMatching(
    /trouble getting.*?eslint.*non-existent-prettier-module/,
  );
  expect(logger.error).toHaveBeenCalledWith(errorString);
});

test('resolves to the eslint module relative to the given filePath', async () => {
  const filePath = require.resolve('../../tests/fixtures/paths/foo.js');
  await format({ text: '', filePath });
  const stateObj = {
    eslintPath: require.resolve(
      '../../tests/fixtures/paths/node_modules/eslint/index.js',
    ),
    prettierPath: require.resolve(
      '../../tests/fixtures/paths/node_modules/prettier/index.js',
    ),
  };
  // console.dir({stateObj});
  expect(global.__PRETTIER_ESLINT_TEST_STATE__).toMatchObject(stateObj);
});

test('resolves to the local eslint module', async () => {
  const filePath = '/blah-blah/default-config.js';
  await format({ text: '', filePath });
  expect(global.__PRETTIER_ESLINT_TEST_STATE__).toMatchObject({
    // without Jest's mocking, these would actually resolve to the
    // project modules :) The fact that vitest's mocking is being
    // applied is good enough for this test.
    eslintPath: require.resolve('../__mocks__/eslint.mjs'),
    prettierPath: require.resolve('../__mocks__/prettier.mjs'),
  });
});

test('reads text from fs if filePath is provided but not text', async () => {
  const spy = vi.spyOn(fsMock, 'readFileSync').mockImplementation(() => {
    return defaultInputText();
  });
  const filePath = '/blah-blah/some-file.js';
  await format({ filePath });

  expect(spy).toHaveBeenCalledWith(filePath, 'utf8');
});

test('logs error if it cannot read the file from the filePath', async () => {
  const spy = vi.spyOn(fsMock, 'readFileSync').mockImplementationOnce(() => {
    throw new Error('some error');
  });

  await expect(() =>
    format({ filePath: '/some-path.js' }),
  ).rejects.toThrowError(/some error/);
  expect(logger.error).toHaveBeenCalledTimes(1);
});

test('calls prettier.resolveConfig with the file path', async () => {
  const filePath = require.resolve('../../tests/fixtures/paths/foo.js');
  await format({
    filePath,
    text: defaultInputText(),
    eslintConfig: getESLintConfigWithDefaultRules(),
  });
  expect(prettierMock.resolveConfig).toHaveBeenCalledTimes(1);
  expect(prettierMock.resolveConfig).toHaveBeenCalledWith(filePath);
});

test('does not raise an error if prettier.resolveConfig is not defined', async () => {
  const filePath = require.resolve('../../tests/fixtures/paths/foo.js');
  const originalPrettierMockResolveConfig = prettierMock.resolveConfig;
  prettierMock.resolveConfig = undefined;

  async function callingFormat() {
    return format({
      filePath,
      text: defaultInputText(),
      eslintConfig: getESLintConfigWithDefaultRules(),
    });
  }

  await expect(callingFormat).not.toThrowError();

  prettierMock.resolveConfig = originalPrettierMockResolveConfig;
});

test('logs if there is a problem making the CLIEngine', async () => {
  const error = new Error('fake error');
  eslintMock.ESLint.mockImplementation(() => {
    throw error;
  });
  await expect(() => format({ text: '' })).rejects.toThrowError(error);
  eslintMock.ESLint.mockRestore();
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
          functions: 'always-multiline',
        },
      ],
      'arrow-parens': [2, 'as-needed'],
      ...overrides,
    },
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
