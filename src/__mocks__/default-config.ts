const defaultConfig = {
  rules: {
    semi: [2, 'never'],
    'max-len': [2, 120, 2],
    indent: [2, 2, { SwitchCase: 1 }],
    quotes: [
      2,
      'single',
      { avoidEscape: true, allowTemplateLiterals: true }
    ],
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
    'arrow-parens': [2, 'as-needed']
  }
};

export default defaultConfig;
