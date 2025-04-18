// @ts-check

import base from '@1stg/eslint-config';
import nodeDependencies from 'eslint-plugin-node-dependencies';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...base,
  ...nodeDependencies.configs['flat/recommended'],
  {
    ignores: ['test/fixtures', '!test/fixtures/paths/node_modules/**/*.js'],
  },
  {
    rules: {
      'prettier/prettier': 'off',
      'valid-jsdoc': 'off',
      'max-len': 'off',
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'never',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      'import/no-import-module-exports': 'off',
      'arrow-parens': ['error', 'as-needed'],
      quotes: ['error', 'single', { avoidEscape: true }],
    },
  },
  {
    files: ['__mocks__/**/*.{js,ts}', 'test/**/*.spec.ts'],
    languageOptions: {
      globals: globals.jest,
    },
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      'no-magic-numbers': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      // Declaration files use `declare var` for global types.
      // `let`/`const` don’t propagate to the global object, so we disable `no-var`.
      'no-var': 'off',
    },
  },
);
