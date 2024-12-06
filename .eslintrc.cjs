const config = {
  extends: [
    'kentcdodds',
    'kentcdodds/jest',
    'plugin:node-dependencies/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
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
  settings: {
    'import/ignore': ['node_modules', 'src'], // Using CommonJS in src
  },
};

module.exports = config;
