/* eslint import/prefer-default-export:0 */
export {getPrettierOptionsFromESLintRules}

/**
 * This accepts an eslintConfig object and converts
 * it to the `prettier` options object
 */
function getPrettierOptionsFromESLintRules(eslintConfig, prettierOptions = {}) {
  const {rules} = eslintConfig
  const optionGetters = {
    printWidth: getPrintWidth,
    tabWidth: getTabWidth,
    parser: getParser,
    singleQuote: getSingleQuote,
    trailingComma: getTrailingComma,
    bracketSpacing: getBraketSpacing,
  }

  return Object.keys(optionGetters).reduce((options, key) => {
    const givenOption = prettierOptions[key]
    const optionIsGiven = prettierOptions[key] !== undefined
    const getter = optionGetters[key]
    options[key] = optionIsGiven ? givenOption : getter(rules)
    return options
  }, {})
}

function getPrintWidth(rules) {
  return getRuleValue(rules, 'max-len', 80)
}

function getTabWidth(rules) {
  const value = getRuleValue(rules, 'indent', 2)
  // if the value is not a number, default to 2
  // use-case is 'tab' where prettier doesn't
  // allow tabs.
  return typeof value === 'number' ? value : 2
}

function getSingleQuote(rules) {
  const value = getRuleValue(rules, 'quotes', 'single')
  return value === 'single'
}

function getTrailingComma(rules) {
  const value = getRuleValue(rules, 'comma-dangle', 'always')
  return value !== 'never'
}

function getParser() {
  // TODO: handle flow parser config
  return 'babylon'
}

function getBraketSpacing() {
  // TODO: handle braketSpacing
  return false
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
