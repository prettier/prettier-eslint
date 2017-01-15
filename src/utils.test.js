import {getPrettierOptionsFromESLintRules} from './utils'

test('getPrettierOptionsFromESLintRules eslint-config-kentcdodds rules', () => {
  const rules = {
    'max-len': [2, 120, 2],
    indent: [2, 2, {SwitchCase: 1}],
    quotes: [2, 'single', {avoidEscape: true, allowTemplateLiterals: true}],
    'comma-dangle': [2, {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'always-multiline',
    }],
    'arrow-parens': [2, 'as-needed'],
  }
  const options = getPrettierOptionsFromESLintRules({rules})
  expect(options).toEqual({
    printWidth: 120,
    tabWidth: 2,
    useFlowParser: false,
    singleQuote: true,
    trailingComma: true,
    bracketSpacing: false,
    arrowParensAlways: false,
  })
})

test('getPrettierOptionsFromESLintRules handles value that is not an array', () => {
  const rules = {
    'max-len': 2,
  }
  const options = getPrettierOptionsFromESLintRules({rules})
  expect(options).toMatchObject({
    printWidth: 80,
  })
})
