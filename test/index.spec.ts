/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/unbound-method, sonarjs/fixme-tag */

// eslint-disable-next-line unicorn/prefer-node-protocol -- mocked
import fsMock from 'fs';
import path from 'node:path';

import eslintMock, { type ESLint, type Linter } from 'eslint';
import loglevelMock from 'loglevel-colored-level-prefix';
import prettierMock from 'prettier';
import stripIndent from 'strip-indent';

import {
  type ESLintConfig,
  format,
  analyze,
  PrettierOptions,
} from 'prettier-eslint';

jest.mock('fs');

// NOTE(cedric): this is a workaround to also mock `node:fs`
jest.mock('node:fs', () => fsMock);

const {
  mock: { logger },
} = loglevelMock;
// loglevelMock.mock.logThings = ['debug']

const filePath = path.resolve('./mock/default-config.js');

const tests: Array<{
  title: string;
  input: {
    text: string;
    eslintConfig?: ESLintConfig;
    filePath?: string;
    prettierLast?: boolean;
    prettierOptions?: PrettierOptions;
    fallbackPrettierOptions?: PrettierOptions;
  };
  output: string;
}> = [
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
    input: {
      text: defaultInputText(),
      filePath,
      prettierLast: true,
      prettierOptions: {
        semi: true,
      },
    },
    output: prettierLastOutput(),
  },
  {
    title: 'with a filePath and no config',
    input: {
      text: defaultInputText(),
      filePath,
    },
    output: defaultOutput(),
  },
  {
    title: 'with a default config and overrides',
    input: {
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
      filePath,
    },
    output: 'const {foo} = bar',
  },
  {
    title: 'with an empty config and fallbacks',
    input: {
      text: 'const { foo } = bar;',
      eslintConfig: {},
      filePath,
      fallbackPrettierOptions: { bracketSpacing: false },
    },
    output: 'const {foo} = bar',
  },
  {
    title: 'without a filePath and no config',
    input: { text: defaultInputText() },
    output: noopOutput(),
  },
  {
    title: 'inferring bracketSpacing',
    input: {
      text: 'var foo = {bar: baz};',
      eslintConfig: { rules: { 'object-curly-spacing': ['error', 'always'] } },
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
            { objectsInObjects: false, arraysInObjects: false },
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
        rules: { 'no-var': 'error' },
        ignorePattern: 'should-be-ignored',
      },
      filePath: path.resolve('should-be-ignored.js'),
    },
    output: 'var x = 0;',
  },
  // if you have a bug report or something,
  // go ahead and add a test case here
  {
    title: 'with code that needs no fixing',
    input: {
      text: 'var [foo, { bar }] = window.APP;',
      eslintConfig: { rules: {} },
    },
    output: 'var [foo, { bar }] = window.APP;',
  },
  {
    title: 'accepts config globals as array',
    input: {
      text: defaultInputText(),
      eslintConfig: { globals: ['window:writable'] },
    },
    output: noopOutput(),
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
    title: 'TypeScript example',
    input: {
      text: 'function Foo (this: void) { return this; }',
      filePath: path.resolve('./test.ts'),
    },
    output: 'function Foo(this: void) {\n  return this;\n}',
  },
  {
    title: 'Vue.js example',
    input: {
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
    input: {
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
    input: {
      text: 'type Query{test: Test}',
      filePath: path.resolve('./test.gql'),
    },
    output: 'type Query {\n  test: Test\n}',
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
    title: 'Markdown example',
    input: {
      text: '#   Foo\n _bar_',
      filePath: path.resolve('./test.md'),
    },
    output: '# Foo\n\n_bar_',
  },
  {
    title: 'Test eslintConfig.globals as an object',
    input: {
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

beforeEach(() => {
  // @ts-expect-error -- FIXME: Fix this type error
  eslintMock.mock.lintText.mockClear();
  // @ts-expect-error -- FIXME: Fix this type error
  eslintMock.mock.calculateConfigForFile.mockClear();
  // @ts-expect-error -- FIXME: Fix this type error
  prettierMock.format.mockClear();
  // @ts-expect-error -- FIXME: Fix this type error
  prettierMock.resolveConfig.mockClear();
  // @ts-expect-error -- FIXME: Fix this type error
  fsMock.readFileSync.mockClear();
  loglevelMock.mock.clearAll();
  globalThis.__PRETTIER_ESLINT_TEST_STATE__ = {};
});

for (const { title, input, output } of tests) {
  // eslint-disable-next-line jest/valid-title -- isn't this a valid title?
  test(title, async () => {
    input.text = stripIndent(input.text).trim();
    const expected = stripIndent(output).trim();
    const actual = await format(input);
    // adding the newline in the expected because
    // prettier adds a newline to the end of the input
    expect(actual).toBe(`${expected}\n`);
  });
}

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
  const { lintText } =
    // @ts-expect-error -- FIXME: Fix this type error
    eslintMock.mock as ESLint;
  const error = new Error('Something happened');
  // @ts-expect-error -- FIXME: Fix this type error
  lintText.throwError = error;

  await expect(() => format({ text: '' })).rejects.toThrow(error);
  expect(logger.error).toHaveBeenCalledTimes(1);
  // @ts-expect-error -- FIXME: Fix this type error
  lintText.throwError = null;
});

test('logLevel is used to configure the logger', async () => {
  logger.setLevel = jest.fn();
  await format({ text: '', logLevel: 'silent' });
  expect(logger.setLevel).toHaveBeenCalledTimes(1);
  expect(logger.setLevel).toHaveBeenCalledWith('silent');
});

test('when prettier throws, log to logger.error and throw the error', async () => {
  const error = new Error('something bad happened');
  // @ts-expect-error -- FIXME: Fix this type error
  prettierMock.format.throwError = error;

  await expect(() => format({ text: '' })).rejects.toThrow(error);
  expect(logger.error).toHaveBeenCalledTimes(1);
  // @ts-expect-error -- FIXME: Fix this type error
  prettierMock.format.throwError = null;
});

test('can accept a path to an eslint module and uses that instead.', async () => {
  const eslintPath = path.join(__dirname, '../__mocks__/eslint');
  await format({ text: '', eslintPath });
  expect(
    // @ts-expect-error -- FIXME: Fix this type error
    eslintMock.mock.lintText,
  ).toHaveBeenCalledTimes(1);
});

test('fails with an error if the eslint module cannot be resolved.', async () => {
  const eslintPath = path.join(
    __dirname,
    '../__mocks__/non-existent-eslint-module',
  );

  await expect(() => format({ text: '', eslintPath })).rejects.toThrow(
    /non-existent-eslint-module/,
  );
  expect(logger.error).toHaveBeenCalledTimes(1);

  const errorString = expect.stringMatching(
    /trouble getting.*?eslint.*non-existent-eslint-module/,
  ) as string;

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

  await expect(() => format({ text: '', prettierPath })).rejects.toThrow(
    /non-existent-prettier-module/,
  );
  expect(logger.error).toHaveBeenCalledTimes(1);
  const errorString = expect.stringMatching(
    /trouble getting.*?eslint.*non-existent-prettier-module/,
  ) as string;
  expect(logger.error).toHaveBeenCalledWith(errorString);
});

test('resolves to the eslint module relative to the given filePath', async () => {
  const filePath = require.resolve('./fixtures/paths/foo.js');
  await format({ text: '', filePath });
  const stateObj = {
    eslintPath: require.resolve(
      './fixtures/paths/node_modules/eslint/index.js',
    ),
    prettierPath: require.resolve(
      './fixtures/paths/node_modules/prettier/index.js',
    ),
  };
  expect(globalThis.__PRETTIER_ESLINT_TEST_STATE__).toMatchObject(stateObj);
});

test('resolves to the local eslint module', async () => {
  const filePath = '/blah-blah/default-config.js';
  await format({ text: '', filePath });
  expect(globalThis.__PRETTIER_ESLINT_TEST_STATE__).toMatchObject({
    // without Jest's mocking, these would actually resolve to the
    // project modules :) The fact that jest's mocking is being
    // applied is good enough for this test.
    eslintPath: require.resolve('../__mocks__/eslint'),
    prettierPath: require.resolve('../__mocks__/prettier'),
  });
});

test('reads text from fs if filePath is provided but not text', async () => {
  const readFileSyncMockSpy = jest.spyOn(fsMock, 'readFileSync');

  const filePath = '/blah-blah/some-file.js';
  await format({ filePath });

  expect(readFileSyncMockSpy).toHaveBeenCalledWith(filePath, 'utf8');
});

test('logs error if it cannot read the file from the filePath', async () => {
  const originalMock = fsMock.readFileSync;
  fsMock.readFileSync = jest.fn(() => {
    throw new Error('some error');
  });
  await expect(() => format({ filePath: '/some-path.js' })).rejects.toThrow(
    /some error/,
  );
  expect(logger.error).toHaveBeenCalledTimes(1);
  fsMock.readFileSync = originalMock;
});

test('calls prettier.resolveConfig with the file path', async () => {
  const filePath = require.resolve('./fixtures/paths/foo.js');
  await format({
    filePath,
    text: defaultInputText(),
    eslintConfig: getESLintConfigWithDefaultRules(),
  });
  expect(prettierMock.resolveConfig).toHaveBeenCalledTimes(1);
  expect(prettierMock.resolveConfig).toHaveBeenCalledWith(filePath);
});

test('does not raise an error if prettier.resolveConfig is not defined', async () => {
  const filePath = require.resolve('./fixtures/paths/foo.js');
  const originalPrettierMockResolveConfig = prettierMock.resolveConfig;
  // @ts-expect-error -- mocking
  delete prettierMock.resolveConfig;

  async function callingFormat() {
    return format({
      filePath,
      text: defaultInputText(),
      eslintConfig: getESLintConfigWithDefaultRules(),
    });
  }

  await expect(callingFormat()).resolves.not.toThrow();

  prettierMock.resolveConfig = originalPrettierMockResolveConfig;
});

test('logs if there is a problem making the CLIEngine', async () => {
  const error = new Error('fake error');
  // @ts-expect-error -- FIXME: Fix this type error
  eslintMock.ESLint.mockImplementation(() => {
    throw error;
  });
  await expect(() => format({ text: '' })).rejects.toThrow(error);
  // @ts-expect-error -- FIXME: Fix this type error
  eslintMock.ESLint.mockReset();
  expect(logger.error).toHaveBeenCalledTimes(1);
});

function getESLintConfigWithDefaultRules(
  overrides?: Linter.RulesRecord,
): ESLintConfig {
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
      console.log('Hello world!', and, stuff);
    }
  `;
}
