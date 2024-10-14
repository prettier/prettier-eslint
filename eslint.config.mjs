import { fixupConfigRules, includeIgnoreFile} from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import vitest from 'eslint-plugin-vitest';
import globals from 'globals';
import prettierConfig from "eslint-config-prettier";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compatPlugin from 'eslint-plugin-compat';
import stylisticEslintPlugin from '@stylistic/eslint-plugin';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});
export default [
  includeIgnoreFile(gitignorePath),{
    ignores: [
      '**/node_modules',
      '**/.nyc_output',
      '**/coverage',
      '**/dist',
      'src/__mocks__',
      'src/__tests__',
      'tests/fixtures/',
      'babel.config.js',
      '.prettierrc.js',
      'package-scripts.js',
      'jest.config.js'
    ],
  },
  prettierConfig,
  ...fixupConfigRules(compat.extends(
    'eslint:recommended',
    'prettier'
  )),
  {
  files: ['src/**/*.js'],

  linterOptions: {
    reportUnusedDisableDirectives: true,
  },
  plugins: {
    import: importPlugin,
    '@stylistic': stylisticEslintPlugin,
    '@typescript-eslint': typescriptEslintPlugin,
    compat: compatPlugin,
    prettier: prettierPlugin,
  },
  rules: {
    '@stylistic/padded-blocks': ['error', 'never'],
    '@stylistic/no-multiple-empty-lines': ["error", { max: 1, maxEOF: 0, maxBOF: 0 }],
    '@stylistic/comma-dangle': 'error',
    quotes: [1, 'single'],
    'no-undef': 2,
    'no-console': ['warn', {
      allow: ['warn', 'error']
    }],
    'max-lines': ['error', {
      max: 500,
      skipBlankLines: false
    }],
    'no-unused-vars': 'off',
    'prefer-const': 'error',
    'global-strict': 0,
    indent: [1, 2, {
      SwitchCase: 1
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@stylistic/no-extra-semi': 1,
    'no-underscore-dangle': 0,
    '@stylistic/no-trailing-spaces': [1, {
      skipBlankLines: true
    }],
    '@stylistic/padding-line-between-statements': ['error', {
      blankLine: 'always',
      prev: '*',
      next: 'return'
    }, {
      blankLine: 'always',
      prev: '*',
      next: 'export'
    }, {
      blankLine: 'always',
      prev: 'export',
      next: 'export'
    }, {
      blankLine: 'always',
      prev: 'export',
      next: '*'
    }, {
      blankLine: 'always',
      prev: '*',
      next: 'if'
    }, {
      blankLine: 'always',
      prev: 'if',
      next: '*'
    }, {
      blankLine: 'always',
      prev: 'const',
      next: '*'
    }, {
      blankLine: 'always',
      prev: '*',
      next: 'const'
    }, {
      blankLine: 'always',
      prev: 'multiline-const',
      next: '*'
    }, {
      blankLine: 'always',
      prev: '*',
      next: 'multiline-const'
    }, {
      blankLine: 'always',
      prev: 'let',
      next: '*'
    }, {
      blankLine: 'always',
      prev: '*',
      next: 'let'
    }, {
      blankLine: 'always',
      prev: 'var',
      next: '*'
    }, {
      blankLine: 'always',
      prev: '*',
      next: 'var'
    }, {
      blankLine: 'always',
      prev: 'const',
      next: 'let'
    }, {
      blankLine: 'never',
      prev: 'const',
      next: 'const'
    }, {
      blankLine: 'always',
      prev: 'multiline-const',
      next: 'multiline-const'
    }, {
      blankLine: 'never',
      prev: 'let',
      next: 'let'
    }, {
      blankLine: 'never',
      prev: 'var',
      next: 'var'
    }, {
      blankLine: 'always',
      prev: 'const',
      next: 'let'
    }, {
      blankLine: 'always',
      prev: 'const',
      next: 'var'
    }, {
      blankLine: 'always',
      prev: 'const',
      next: 'multiline-const'
    }, {
      blankLine: 'always',
      prev: 'multiline-const',
      next: 'let'
    }, {
      blankLine: 'always',
      prev: 'multiline-const',
      next: 'var'
    }, {
      blankLine: 'always',
      prev: 'let',
      next: 'var'
    }, {
      blankLine: 'always',
      prev: '*',
      next: 'cjs-import'
    }, {
      blankLine: 'always',
      prev: 'cjs-import',
      next: '*'
    }, {
      blankLine: 'never',
      prev: 'cjs-import',
      next: 'cjs-import'
    }],
    "@typescript-eslint/no-empty-object-type": "error",
    'no-unreachable': 1,
    'no-alert': 1,
    '@stylistic/semi': 1,
    'import/no-unused-modules': [1, {
      unusedExports: true,
      src: ['./src']
    }],
    'import/no-named-as-default': 0,
    'import/order': ['error', {
      groups: ['external', 'builtin', 'internal', 'parent', 'sibling', 'index'],

      pathGroupsExcludedImportTypes: ['internal'],

      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      },

      'newlines-between': 'always'
    }],
  },
  languageOptions: {
    globals: {
      ...globals.browser,
      JSX: true,
      process: true,
      vi: true,
      expect: true,
      test: true,
      it: true,
      describe: true,
      afterAll: true,
      beforeAll: true,
      afterEach: true,
      beforeEach: true
    },
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',

    parserOptions: {
      ecmaFeatures: {
        classes: true,
      }
    }
  },
  settings: {
    'import/resolver': {
      typescript: {}
    }
  },
},
{
  files: ['**/__tests__/*.ts', '**/__tests__/*.tsx'],

  plugins: {
    vitest
  },

  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node
    }
  },

  rules: {
    'max-lines': 0
  }
}];
