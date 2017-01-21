import {getPrettierOptionsFromESLintRules} from './utils'

const getPrettierOptionsFromESLintRulesTests = [
  {
    rules: {
      'max-len': [2, 120, 2],
      indent: [2, 2, {SwitchCase: 1}],
      quotes: [2, 'single', {avoidEscape: true, allowTemplateLiterals: true}],
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
    },
    options: {
      printWidth: 120,
      tabWidth: 2,
      useFlowParser: false,
      singleQuote: true,
      trailingComma: true,
      bracketSpacing: false,
      arrowParensAlways: false,
    },
  },
  {rules: {'max-len': 2}, options: {printWidth: 80}},
  {rules: {'comma-dangle': [2, 'never']}, options: {trailingComma: false}},
]

getPrettierOptionsFromESLintRulesTests.forEach(({rules, options}, index) => {
  test(`getPrettierOptionsFromESLintRulesTests ${index}`, () => {
    const actualOptions = getPrettierOptionsFromESLintRules({rules})
    expect(actualOptions).toMatchObject(options)
  })
})
