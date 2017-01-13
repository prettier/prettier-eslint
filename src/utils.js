export {getPrettierOptionsFromESLintRules} // eslint-disable-line import/prefer-default-export

/**
 * This accepts an eslintConfig object and converts
 * it to the `prettier` options object
 */
function getPrettierOptionsFromESLintRules(eslintConfig) {
  const {rules} = eslintConfig
  const options = {
    printWidth: getPrintWidth(rules),
    tabWidth: getTabWidth(rules),
    useFlowParser: false, // TODO: handle flow parser config
    singleQuote: getSingleQuote(rules),
    trailingComma: getTrailingComma(rules),
    bracketSpacing: false, // TODO: handle this one
    arrowParensAlways: getArrowParens(rules),
  }

  return options
}

function getPrintWidth(rules) {
  return getRuleValue(rules, 'max-len', 80)
}

function getTabWidth(rules) {
  return getRuleValue(rules, 'indent', 2)
}

function getSingleQuote(rules) {
  const value = getRuleValue(rules, 'quotes', 'single')
  return value === 'single'
}

function getTrailingComma(rules) {
  return getRuleValue(rules, 'comma-dangle', true)
}

function getArrowParens(rules) {
  const value = getRuleValue(rules, 'arrow-parens', 'as-needed')
  return value !== 'as-needed'
}

function getRuleValue(rules, name, defaultValue) {
  const ruleConfig = rules[name]
  if (Array.isArray(ruleConfig)) {
    const [, value] = ruleConfig
    if (typeof value === 'object') {
      // TODO: handle object configuration
    } else {
      return value
    }
  }
  // no value configured
  return defaultValue
}
