import path from 'node:path';
import { beforeEach, expect, test } from 'vitest';
import { getOptionsForFormatting } from '../utils.mjs';

const getPrettierOptionsFromESLintRulesTests = [
  {
    title: 'all rules interaction',
    rules: {
      title: 'all rules interaction',
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
      'object-curly-spacing': [2, 'never'],
    },
    options: {
      printWidth: 120,
      tabWidth: 2,
      singleQuote: true,
      trailingComma: 'all',
      bracketSpacing: false,
    },
  },
  {
    title: 'object-curly-spacing, always',
    rules: { 'object-curly-spacing': [2, 'always'] },
    options: { bracketSpacing: true },
  },
  {
    title: 'object-curly-spacing, never',
    rules: { 'object-curly-spacing': [2, 'never'] },
    options: { bracketSpacing: false },
  },
  {
    title: 'max-len',
    rules: { 'max-len': 2 },
    options: {},
  },
  {
    title: 'comma-dangle, never',
    rules: { 'comma-dangle': [2, 'never'] },
    options: { trailingComma: 'none' },
  },
  {
    title: 'comma-dangle, always',
    rules: { 'comma-dangle': [2, 'always'] },
    options: { trailingComma: 'es5' },
  },
  {
    title: 'comma-dangle, always-multiline',
    rules: {
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
    },
    options: { trailingComma: 'all' },
  },
  {
    title: 'comma-dangle, always-multiline except functions',
    rules: {
      'comma-dangle': [
        2,
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'never',
        },
      ],
    },
    options: { trailingComma: 'es5' },
  },
  {
    title: 'comma-dangle, never',
    rules: {
      'comma-dangle': [
        2,
        {
          arrays: 'never',
          objects: 'never',
          imports: 'never',
          exports: 'never',
          functions: 'never',
        },
      ],
    },
    options: { trailingComma: 'none' },
  },
  {
    title: 'max-len, code 120',
    rules: { 'max-len': ['error', { code: 120 }] },
    options: { printWidth: 120 },
  },
  {
    title: 'quotes, double',
    rules: { quotes: [2, 'double'] },
    options: { singleQuote: false },
  },
  {
    title: 'quotes, backtick',
    rules: { quotes: [2, 'backtick'] },
    options: { singleQuote: false },
  },
  {
    title: 'comma-dangle, imports never, exports never',
    rules: {
      'comma-dangle': [
        2,
        {
          imports: 'never',
          exports: 'never',
        },
      ],
    },
    options: { trailingComma: 'none' },
  },
  {
    title: 'comma-dangle, always-multiline',
    rules: { 'comma-dangle': [2, 'always-multiline'] },
    options: { trailingComma: 'es5' },
  },
  {
    title: 'no rules',
    rules: {},
    options: { bracketSameLine: true },
    fallbackPrettierOptions: { bracketSameLine: true },
  },
  {
    title: 'react/jsx-closing-bracket-location, after-props',
    rules: { 'react/jsx-closing-bracket-location': [2, 'after-props'] },
    options: { bracketSameLine: true },
  },
  {
    title: 'react/jsx-closing-bracket-location, tag-aligned',
    rules: { 'react/jsx-closing-bracket-location': [2, 'tag-aligned'] },
    options: { bracketSameLine: false },
  },
  {
    title: 'react/jsx-closing-bracket-location, after-props',
    rules: {
      'react/jsx-closing-bracket-location': [
        2,
        {
          nonEmpty: 'after-props',
        },
      ],
    },
    options: { bracketSameLine: true },
  },
  {
    title: 'arrow-parens, always',
    rules: {
      'arrow-parens': [2, 'always'],
    },
    options: { arrowParens: 'always' },
  },
  {
    title: 'arrow-parens as-needed',
    rules: {
      'arrow-parens': [2, 'as-needed'],
    },
    options: { arrowParens: 'avoid' },
  },
  {
    title: 'prettier/prettier & quotes conflict',
    rules: {
      'prettier/prettier': [2, { singleQuote: false }],
      quotes: [2, 'single'],
    },
    options: {
      singleQuote: false,
    },
  },

  // If an ESLint rule is disabled fall back to prettier defaults.
  {
    title: 'max-len off, prettier defaults',
    rules: { 'max-len': [0, { code: 120 }] },
    options: {},
  },
  {
    title: 'quotes off, single, prettier defaults',
    rules: { quotes: ['off', 'single'] },
    options: {},
  },
  {
    title: 'quotes off, backtick, prettier defaults',
    rules: { quotes: ['off', 'backtick'] },
    options: {},
  },
  {
    title: 'semi off, prettier defaults',
    rules: { semi: 'off' },
    options: {},
  },
  {
    title: 'semi off, never, prettier defaults',
    rules: { semi: ['off', 'never'] },
    options: {},
  },
  {
    title: 'semi warn, always, prettier defaults',
    rules: { semi: ['warn', 'always'] },
    options: { semi: true },
  },
  {
    title: 'semi error, never, prettier defaults',
    rules: { semi: ['error', 'never'] },
    options: { semi: false },
  },
  {
    title: 'semi error, never (2), prettier defaults',
    rules: { semi: [2, 'never'] },
    options: { semi: false },
  },
  {
    title: 'indent off, prettier defaults',
    rules: { indent: 'off' },
    options: {},
  },
  {
    title: 'indent off, tab, prettier defaults',
    rules: { indent: ['off', 'tab'] },
    options: {},
  },
  {
    title: 'indent warn, 2, prettier defaults',
    rules: { indent: ['warn', 2] },
    options: { tabWidth: 2 },
  },
  {
    title: 'indent warn, 4, prettier defaults',
    rules: { indent: ['warn', 4] },
    options: { tabWidth: 4 },
  },
  {
    title: 'indent error, tab, prettier defaults',
    rules: { indent: ['error', 'tab'] },
    options: { useTabs: true },
  },
  {
    title: 'indent error (2), tab, prettier defaults',
    rules: { indent: [2, 'tab'] },
    options: { useTabs: true },
  },
  {
    title: 'react/jsx-closing-bracket-location off, prettier defaults',
    rules: { 'react/jsx-closing-bracket-location': [0] },
    options: {},
  },
  {
    title: 'arrow-parents off, prettier defaults',
    rules: { 'arrow-parens': [0] },
    options: {},
  },
];

const eslintPath = path.join(__dirname, '../__mocks__/eslint');

beforeEach(() => {
  global.__PRETTIER_ESLINT_TEST_STATE__ = {};
});

test.for(getPrettierOptionsFromESLintRulesTests)(
  'getPrettierOptionsFromESLintRules $title',
  ({ rules, options, prettierOptions, fallbackPrettierOptions }) => {
    const { prettier } = getOptionsForFormatting(
      { rules },
      prettierOptions,
      fallbackPrettierOptions,
    );

    expect(prettier).toStrictEqual(options);
  },
);

test('if prettierOptions are provided, those are preferred', () => {
  const { prettier } = getOptionsForFormatting(
    { rules: { quotes: [2, 'single'] } },
    {
      singleQuote: false,
    },
    undefined,
    eslintPath,
  );
  expect(prettier).toMatchObject({ singleQuote: false });
});

// eslint-disable-next-line max-len
test('if fallbacks are provided, those are preferred over disabled eslint rules', () => {
  const { prettier } = getOptionsForFormatting(
    {
      rules: {
        quotes: [0],
      },
    },
    {},
    {
      singleQuote: true,
    },
  );
  expect(prettier).toMatchObject({ singleQuote: true });
});

test('if fallbacks are provided, those are used if not found in eslint', () => {
  const { prettier } = getOptionsForFormatting({ rules: {} }, undefined, {
    singleQuote: false,
  });
  expect(prettier).toMatchObject({ singleQuote: false });
});

test('eslint max-len.tabWidth value should be used for tabWidth when tabs are used', () => {
  const { prettier } = getOptionsForFormatting(
    {
      rules: {
        indent: ['error', 'tab'],
        'max-len': [
          2,
          {
            tabWidth: 4,
          },
        ],
      },
    },
    undefined,
    undefined,
  );

  expect(prettier).toMatchObject({
    tabWidth: 4,
    useTabs: true,
  });
});

test('eslint config has only necessary properties', () => {
  const { eslint } = getOptionsForFormatting(
    {
      globals: ['window:false'],
      rules: { 'no-with': 'error', quotes: [2, 'single'] },
    },
    undefined,
    undefined,
  );
  expect(eslint).toStrictEqual({
    fix: true,
    useEslintrc: false,
    globals: ['window:false'],
    rules: { ['no-with']: 'error', quotes: [2, 'single'] },
  });
});

test('useEslintrc is set to the given config value', () => {
  const { eslint } = getOptionsForFormatting(
    { useEslintrc: true, rules: {} },
    undefined,
    undefined,
  );
  expect(eslint).toMatchObject({ fix: true, useEslintrc: true });
});

test('Turn off unfixable rules', () => {
  const { eslint } = getOptionsForFormatting(
    {
      rules: {
        'global-require': ['off'],
        quotes: ['error', 'double'],
      },
    },
    undefined,
    undefined,
  );

  expect(eslint).toMatchObject({
    rules: {
      'global-require': ['off'],
      quotes: ['error', 'double'],
    },
    fix: true,
    globals: {},
    useEslintrc: false,
  });
});
