// @ts-check

import base from '@1stg/eslint-config';
import nodeDependencies from 'eslint-plugin-node-dependencies';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...base,
  ...nodeDependencies.configs['flat/recommended'],
  {
    ignores: ['test/fixtures'],
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
    files: ['**/__mocks__/**/*.js', '**/*.spec.ts'],
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
      'no-var': 'off',
    },
  },
);
