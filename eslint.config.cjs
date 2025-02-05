import js from "@eslint/js";

export default [js.configs.recommended,{  
  languageOptions: {
    ecmaVersion: 2022,
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
  }
}];
