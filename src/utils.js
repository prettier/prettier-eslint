/* eslint import/prefer-default-export:0 */
export {getPrettierOptionsFromESLintRules}

/**
 * This accepts an eslintConfig object and converts
 * it to the `prettier` options object
 */
function getPrettierOptionsFromESLintRules(eslintConfig) {
  const {rules} = eslintConfig
  const options = {
    printWidth: getPrintWidth(rules),
    tabWidth: getTabWidth(rules),
    // TODO: handle flow parser config
    useFlowParser: false,
    singleQuote: getSingleQuote(rules),
    trailingComma: getTrailingComma(rules),
    // TODO: handle braketSpacing
    bracketSpacing: false,
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
