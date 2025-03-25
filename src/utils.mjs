/* eslint import/no-dynamic-require:0 */
import { oneLine } from 'common-tags';
import delve from 'dlv';
import getLogger from 'loglevel-colored-level-prefix';
import { Linter } from 'eslint';

const logger = getLogger({ prefix: 'prettier-eslint' });
const RULE_DISABLED = {};
const RULE_NOT_CONFIGURED = 'RULE_NOT_CONFIGURED';
const ruleValueExists = prettierRuleValue =>
  prettierRuleValue !== RULE_NOT_CONFIGURED &&
  prettierRuleValue !== RULE_DISABLED &&
  typeof prettierRuleValue !== 'undefined';
const OPTION_GETTERS = {
  printWidth: {
    ruleValue: rules => getRuleValue(rules, 'max-len', 'code'),
    ruleValueToPrettierOption: getPrintWidth,
  },
  tabWidth: {
    ruleValue: rules => {
      let value = getRuleValue(rules, 'indent');
      if (value === 'tab') {
        value = getRuleValue(rules, 'max-len', 'tabWidth');
      }
      return value;
    },
    ruleValueToPrettierOption: getTabWidth,
  },
  singleQuote: {
    ruleValue: rules => getRuleValue(rules, 'quotes'),
    ruleValueToPrettierOption: getSingleQuote,
  },
  trailingComma: {
    ruleValue: rules => getRuleValue(rules, 'comma-dangle', []),
    ruleValueToPrettierOption: getTrailingComma,
  },
  bracketSpacing: {
    ruleValue: rules => getRuleValue(rules, 'object-curly-spacing'),
    ruleValueToPrettierOption: getBracketSpacing,
  },
  semi: {
    ruleValue: rules => getRuleValue(rules, 'semi'),
    ruleValueToPrettierOption: getSemi,
  },
  useTabs: {
    ruleValue: rules => getRuleValue(rules, 'indent'),
    ruleValueToPrettierOption: getUseTabs,
  },
  bracketSameLine: {
    ruleValue: rules =>
      getRuleValue(rules, 'react/jsx-closing-bracket-location', 'nonEmpty'),
    ruleValueToPrettierOption: getBracketSameLine,
  },
  arrowParens: {
    ruleValue: rules => getRuleValue(rules, 'arrow-parens'),
    ruleValueToPrettierOption: getArrowParens,
  },
};

export function getOptionsForFormatting(
  eslintConfig,
  prettierOptions = {},
  fallbackPrettierOptions = {},
) {
  return {
    eslint: getRelevantESLintConfig(eslintConfig),
    prettier: getPrettierOptionsFromESLintRules(
      eslintConfig,
      prettierOptions,
      fallbackPrettierOptions,
    ),
  };
}

function getRelevantESLintConfig(eslintConfig) {
  const linter = new Linter();
  const rules = linter.getRules();
  logger.debug('turning off unfixable rules');

  // Mutate the config, turning off unfixable rules
  rules.forEach((rule, name) => {
    if (!rule.meta.fixable) {
      logger.trace('turning off rule:', name);
      rules.set(name, ['off']);
    }
  });

  const finalConfig = {
    useEslintrc: false,
    ...eslintConfig,
    ...(eslintConfig.rules.size
      ? { rules: Object.fromEntries(Object.entries(eslintConfig.rules)) }
      : undefined),
    fix: true,
    globals: eslintConfig.globals ?? {},
  };

  return finalConfig;
}

/**
 * This accepts an eslintConfig object and converts
 * it to the `prettier` options object
 */
function getPrettierOptionsFromESLintRules(
  eslintConfig,
  prettierOptions,
  fallbackPrettierOptions,
) {
  const { rules } = eslintConfig;

  const prettierPluginOptions = getRuleValue(rules, 'prettier/prettier', []);

  if (ruleValueExists(prettierPluginOptions)) {
    prettierOptions = { ...prettierPluginOptions, ...prettierOptions };
  }

  return Object.keys(OPTION_GETTERS).reduce(
    (options, key) =>
      configureOptions(
        prettierOptions,
        fallbackPrettierOptions,
        key,
        options,
        rules,
      ),
    prettierOptions,
  );
}

// If an ESLint rule that prettier can be configured with is enabled create a
// prettier configuration object that reflects the ESLint rule configuration.
function configureOptions(
  prettierOptions,
  fallbackPrettierOptions,
  key,
  options,
  rules,
) {
  const givenOption = prettierOptions[key];
  const optionIsGiven = givenOption !== undefined;

  if (optionIsGiven) {
    options[key] = givenOption;
  } else {
    const { ruleValue, ruleValueToPrettierOption } = OPTION_GETTERS[key];
    const eslintRuleValue = ruleValue(rules);

    const option = ruleValueToPrettierOption(
      eslintRuleValue,
      fallbackPrettierOptions,
      rules,
    );

    if (option !== undefined) {
      options[key] = option;
    }
  }

  return options;
}

function getPrintWidth(eslintValue, fallbacks) {
  return makePrettierOption('printWidth', eslintValue, fallbacks);
}

function getTabWidth(eslintValue, fallbacks) {
  return makePrettierOption('tabWidth', eslintValue, fallbacks);
}

function getSingleQuote(eslintValue, fallbacks) {
  let prettierValue;

  if (eslintValue === 'single') {
    prettierValue = true;
  } else if (eslintValue === 'double') {
    prettierValue = false;
  } else if (eslintValue === 'backtick') {
    prettierValue = false;
  } else {
    prettierValue = eslintValue;
  }

  return makePrettierOption('singleQuote', prettierValue, fallbacks);
}

function getTrailingComma(eslintValue, fallbacks) {
  let prettierValue;

  if (eslintValue === 'never') {
    prettierValue = 'none';
  } else if (
    typeof eslintValue === 'string' &&
    eslintValue.indexOf('always') === 0
  ) {
    prettierValue = 'es5';
  } else if (typeof eslintValue === 'object') {
    prettierValue = getValFromTrailingCommaConfig(eslintValue);
  } else {
    prettierValue = RULE_NOT_CONFIGURED;
  }

  return makePrettierOption('trailingComma', prettierValue, fallbacks);
}

function getValFromTrailingCommaConfig(objectConfig) {
  const { arrays = '', objects = '', functions = '' } = objectConfig;
  const fns = isAlways(functions);
  const es5 = [arrays, objects].some(isAlways);

  if (fns) {
    return 'all';
  } else if (es5) {
    return 'es5';
  } else {
    return 'none';
  }
}

function getBracketSpacing(eslintValue, fallbacks) {
  let prettierValue;

  if (eslintValue === 'never') {
    prettierValue = false;
  } else if (eslintValue === 'always') {
    prettierValue = true;
  } else {
    prettierValue = eslintValue;
  }

  return makePrettierOption('bracketSpacing', prettierValue, fallbacks);
}

function getSemi(eslintValue, fallbacks) {
  let prettierValue;

  if (eslintValue === 'never') {
    prettierValue = false;
  } else if (eslintValue === 'always') {
    prettierValue = true;
  } else {
    prettierValue = eslintValue;
  }

  return makePrettierOption('semi', prettierValue, fallbacks);
}

function getUseTabs(eslintValue, fallbacks) {
  let prettierValue;

  if (eslintValue === 'tab') {
    prettierValue = true;
  } else {
    prettierValue = RULE_NOT_CONFIGURED;
  }

  return makePrettierOption('useTabs', prettierValue, fallbacks);
}

function getBracketSameLine(eslintValue, fallbacks) {
  let prettierValue;

  if (eslintValue === 'after-props') {
    prettierValue = true;
  } else if (
    eslintValue === 'tag-aligned' ||
    eslintValue === 'line-aligned' ||
    eslintValue === 'props-aligned'
  ) {
    prettierValue = false;
  } else {
    prettierValue = eslintValue;
  }

  return makePrettierOption('bracketSameLine', prettierValue, fallbacks);
}

function getArrowParens(eslintValue, fallbacks) {
  let prettierValue;

  if (eslintValue === 'as-needed') {
    prettierValue = 'avoid';
  } else {
    prettierValue = eslintValue;
  }

  return makePrettierOption('arrowParens', prettierValue, fallbacks);
}

function extractRuleValue(objPath, name, value) {
  // XXX: Ignore code coverage for the following else case
  // There are currently no eslint rules which we can infer prettier
  // options from, that have an object option which we don't know how
  // to infer from.

  // istanbul ignore else
  if (objPath) {
    logger.trace(
      oneLine`
        Getting the value from object configuration of ${name}.
        delving into ${JSON.stringify(value)} with path "${objPath}"
      `,
    );

    return delve(value, objPath, RULE_NOT_CONFIGURED);
  }

  // istanbul ignore next
  logger.debug(
    oneLine`
      The ${name} rule is using an object configuration
      of ${JSON.stringify(value)} but prettier-eslint is
      not currently capable of getting the prettier value
      based on an object configuration for ${name}.
      Please file an issue (and make a pull request?)
    `,
  );

  // istanbul ignore next
  return undefined;
}

function getRuleValue(rules, name, objPath) {
  const ruleConfig = rules[name];

  if (Array.isArray(ruleConfig)) {
    const [ruleSetting, value] = ruleConfig;

    // If `ruleSetting` is set to disable the ESLint rule don't use `value` as
    // it might be a value provided by an overriden config package e.g. airbnb
    // overriden by config-prettier. The airbnb values are provided even though
    // config-prettier disables the rule. Instead use fallback or prettier
    // default.
    if (ruleSetting === 0 || ruleSetting === 'off') {
      return RULE_DISABLED;
    }

    if (typeof value === 'object') {
      return extractRuleValue(objPath, name, value);
    } else {
      logger.trace(
        oneLine`
          The ${name} rule is configured with a
          non-object value of ${value}. Using that value.
        `,
      );
      return value;
    }
  }

  return RULE_NOT_CONFIGURED;
}

function isAlways(val) {
  return val.indexOf('always') === 0;
}

function makePrettierOption(prettierRuleName, prettierRuleValue, fallbacks) {
  if (ruleValueExists(prettierRuleValue)) {
    return prettierRuleValue;
  }

  const fallback = fallbacks[prettierRuleName];
  if (typeof fallback !== 'undefined') {
    logger.debug(
      oneLine`
        The ${prettierRuleName} rule is not configured,
        using provided fallback of ${fallback}
      `,
    );
    return fallback;
  }

  logger.debug(
    oneLine`
      The ${prettierRuleName} rule is not configured,
      let prettier decide
    `,
  );
  return undefined;
}

export async function importModule(modulePath, name) {
  try {
    logger.trace(`importing "${name}" module at "${modulePath}"`);
    return await import(modulePath).then(
      ({ default: defaultExport }) => defaultExport,
    );
  } catch (error) {
    logger.error(
      oneLine`
      There was trouble getting "${name}".
      Is "${modulePath}" a correct path to the "${name}" module?
    `,
    );
    throw error;
  }
}

export async function getESLint(eslintPath, eslintOptions) {
  const { ESLint } = await importModule(eslintPath, 'eslint');
  try {
    return new ESLint(eslintOptions);
  } catch (error) {
    logger.error('There was trouble creating the ESLint CLIEngine.');
    throw error;
  }
}
