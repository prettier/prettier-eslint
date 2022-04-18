const config = {
  extends: ['kentcdodds', 'kentcdodds/jest'],
  rules: {
    'valid-jsdoc': 'off',
    'max-len': 'off',
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always'
      }
    ],
    'import/no-import-module-exports': 'off'
  }
};

module.exports = config;
