import {oneLine} from 'common-tags'
import delve from 'dlv'
import getLogger from './log'

const logger = getLogger()

/* eslint import/prefer-default-export:0 */
export {getOptionsForFormatting}

function getOptionsForFormatting(eslintConfig, prettierOptions = {}) {
  const eslint = getRelevantESLintConfig(eslintConfig)
  const prettier = getPrettierOptionsFromESLintRules(eslint, prettierOptions)
  return {eslint, prettier}
}

function getRelevantESLintConfig(eslintConfig) {
  const {rules} = eslintConfig
  // TODO: remove rules that are not fixable for perf
  // this will require we load the config for every rule...
  // not sure that'll be worth the effort
  // but we may be able to maintain a manual list of rules that
  // are definitely not fixable. Which is what we'll do for now...
  const rulesThatWillNeverBeFixable = [
    // TODO add more
    'no-var',
    'prefer-const',
    'valid-jsdoc',
    'global-require',
    'no-with',
  ]

  logger.debug('reducing eslint rules down to relevant rules only')
  const relevantRules = Object.keys(rules).reduce((
    rulesAccumulator,
    ruleName,
  ) => {
    if (rulesThatWillNeverBeFixable.indexOf(ruleName) === -1) {
      logger.trace(
        `adding to relevant rules:`,
        JSON.stringify({[ruleName]: rules[ruleName]}),
      )
      rulesAccumulator[ruleName] = rules[ruleName]
    } else {
      logger.trace(
        `omitting from relevant rules:`,
        JSON.stringify({[ruleName]: rules[ruleName]}),
      )
    }
    return rulesAccumulator
  }, {})

  return {
    // defaults
    useEslintrc: false,
    ...eslintConfig,
    // overrides
    rules: relevantRules,
    fix: true,
    globals: [], // must be an array for some reason :-/
  }
}

/**
 * This accepts an eslintConfig object and converts
 * it to the `prettier` options object
 */
function getPrettierOptionsFromESLintRules(eslintConfig, prettierOptions) {
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
  return getRuleValue(rules, 'max-len', 80, 'code')
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
  const value = getRuleValue(rules, 'comma-dangle')
  if (typeof value === 'undefined') {
    const actualValue = rules['comma-dangle']
    if (typeof actualValue === 'object') {
      return getValFromObjectConfig(actualValue)
    }
  }

  return value === 'never' ? 'none' : 'all'

  function getValFromObjectConfig(eslintValue) {
    const [, {arrays, objects, functions}] = eslintValue
    const es5 = [arrays, objects].some(isAlways)
    const fns = isAlways(functions)
    // eslint-disable-next-line no-nested-ternary
    return fns ? 'all' : es5 ? 'es5' : 'none'
  }
}

function getParser() {
  // TODO: handle flow parser config
  return 'babylon'
}

function getBraketSpacing() {
  // TODO: handle braketSpacing
  return false
}

function getRuleValue(rules, name, defaultValue, objPath) {
  const ruleConfig = rules[name]
  if (Array.isArray(ruleConfig)) {
    const [, value] = ruleConfig
    if (typeof value === 'object') {
      if (objPath) {
        logger.trace(
          oneLine`
            Getting the value from object configuration of ${name}.
            delving into ${JSON.stringify(value)} with path "${objPath}"
          `,
        )
        return delve(value, objPath, defaultValue)
      } else {
        logger.debug(
          oneLine`
            The ${name} rule is using an object configuration
            of ${JSON.stringify(value)} but prettier-eslint is
            not currently capable of getting the prettier value
            based on an object configuration for ${name}.
            Please file an issue (and make a pull request?)
          `,
        )
      }
    } else {
      logger.trace(
        oneLine`
          The ${name} rule is configured with a
          non-object value of ${value}. Using that value.
        `,
      )
      return value
    }
  }
  logger.debug(
    oneLine`
      The ${name} rule is not configured,
      using default of ${defaultValue}
    `,
  )
  // no value configured
  return defaultValue
}

function isAlways(val) {
  return val.indexOf('always') === 0
}
