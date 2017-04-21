import {oneLine} from 'common-tags'
import delve from 'dlv'
import getLogger from 'loglevel-colored-level-prefix'
import merge from 'lodash.merge'

const logger = getLogger({prefix: 'prettier-eslint'})
const RULE_DISABLED = {}
const OPTION_GETTERS = {
  printWidth: {
    ruleValue: rules => getRuleValue(rules, 'max-len', 80, 'code'),
    ruleValueToPrettierOption: value => value,
  },
  tabWidth: {
    ruleValue: rules => getRuleValue(rules, 'indent', 2),
    ruleValueToPrettierOption: value => getTabWidth(value),
  },
  parser: {
    ruleValue: getParser,
    ruleValueToPrettierOption: getParser,
  },
  singleQuote: {
    ruleValue: rules => getRuleValue(rules, 'quotes', 'single'),
    ruleValueToPrettierOption: value => getSingleQuote(value),
  },
  trailingComma: {
    ruleValue: rules => getRuleValue(rules, 'comma-dangle'),
    ruleValueToPrettierOption: (value, rules) => getTrailingComma(value, rules),
  },
  bracketSpacing: {
    ruleValue: rules => getRuleValue(rules, 'object-curly-spacing', 'never'),
    ruleValueToPrettierOption: value => getBraketSpacing(value),
  },
  semi: {
    ruleValue: rules => getRuleValue(rules, 'semi', 'always'),
    ruleValueToPrettierOption: value => value === 'always',
  },
  useTabs: {
    ruleValue: rules => getRuleValue(rules, 'indent', 2),
    ruleValueToPrettierOption: value => value === 'tab',
  },
}

/* eslint import/prefer-default-export:0 */
export {getOptionsForFormatting, defaultEslintConfig}

function defaultEslintConfig(eslintConfig = {}, defaultConfig = {}) {
  return merge({}, defaultConfig, eslintConfig)
}

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
  const relevantRules = Object.keys(
    rules,
  ).reduce((rulesAccumulator, ruleName) => {
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

  return Object.keys(OPTION_GETTERS).reduce(
    (options, key) => configureOptions(prettierOptions, key, options, rules),
    {},
  )
}

// If an ESLint rule that prettier can be configured with is enabled create a
// prettier configuration object that reflects the ESLint rule configuration.
function configureOptions(prettierOptions, key, options, rules) {
  const givenOption = prettierOptions[key]
  const optionIsGiven = givenOption !== undefined

  if (optionIsGiven) {
    options[key] = givenOption
  } else {
    const {ruleValue, ruleValueToPrettierOption} = OPTION_GETTERS[key]
    const eslintRuleValue = ruleValue(rules)

    if (eslintRuleValue !== RULE_DISABLED) {
      const prettierOptionValue = ruleValueToPrettierOption(
        eslintRuleValue,
        rules,
      )

      if (prettierOptionValue !== RULE_DISABLED) {
        options[key] = prettierOptionValue
      }
    }
  }

  return options
}

function getTabWidth(value) {
  // if it's set to tabs, then the tabWidth value doesn't matter
  return value === 'tab' ? RULE_DISABLED : value
}

function getParser() {
  // TODO: handle flow parser config
  return 'babylon'
}

function getSingleQuote(value) {
  return value === 'single'
}

function getTrailingComma(value, rules) {
  if (typeof value === 'undefined') {
    const actualValue = rules['comma-dangle']
    if (typeof actualValue === 'object') {
      return getValFromObjectConfig(actualValue)
    }
  }

  return value === 'never' ? 'none' : 'es5'

  function getValFromObjectConfig(eslintValue) {
    const [, {arrays, objects, functions}] = eslintValue
    const es5 = [arrays, objects].some(isAlways)
    const fns = isAlways(functions)
    // eslint-disable-next-line no-nested-ternary
    return fns ? 'all' : es5 ? 'es5' : 'none'
  }
}

function getBraketSpacing(value) {
  return value !== 'never'
}

function extractRuleValue(objPath, name, value, defaultValue) {
  if (objPath) {
    logger.trace(
      oneLine`
        Getting the value from object configuration of ${name}.
        delving into ${JSON.stringify(value)} with path "${objPath}"
      `,
    )

    return delve(value, objPath, defaultValue)
  }

  logger.debug(
    oneLine`
      The ${name} rule is using an object configuration
      of ${JSON.stringify(value)} but prettier-eslint is
      not currently capable of getting the prettier value
      based on an object configuration for ${name}.
      Please file an issue (and make a pull request?)
    `,
  )

  return undefined
}

function getRuleValue(rules, name, defaultValue, objPath) {
  const ruleConfig = rules[name]

  if (Array.isArray(ruleConfig)) {
    const [ruleSetting, value] = ruleConfig

    // If `ruleSetting` is set to disable the ESLint rule don't use `value` as
    // it might be a value provided by an overriden config package e.g. airbnb
    // overriden by config-prettier. The airbnb values are provided even though
    // config-prettier disables the rule. Instead fallback to prettier defaults.
    if (ruleSetting === 0 || ruleSetting === 'off') {
      return RULE_DISABLED
    }

    if (typeof value === 'object') {
      return extractRuleValue(objPath, name, value, defaultValue)
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
