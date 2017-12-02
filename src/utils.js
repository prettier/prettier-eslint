import {getSupportInfo} from "prettier";
import { oneLine } from "common-tags";
import delve from "dlv";
import getLogger from "loglevel-colored-level-prefix";

const logger = getLogger({ prefix: "prettier-eslint" });
const RULE_DISABLED = {};
const RULE_NOT_CONFIGURED = "RULE_NOT_CONFIGURED";
const OPTION_GETTERS = {
  printWidth: {
    ruleValue: rules => getRuleValue(rules, "max-len", "code"),
    ruleValueToPrettierOption: getPrintWidth
  },
  tabWidth: {
    ruleValue: rules => {
      let value = getRuleValue(rules, "indent");
      if (value === "tab") {
        value = getRuleValue(rules, "max-len", "tabWidth");
      }
      return value;
    },
    ruleValueToPrettierOption: getTabWidth
  },
  parser: {
    ruleValue: () => RULE_NOT_CONFIGURED,
    ruleValueToPrettierOption: getParser
  },
  singleQuote: {
    ruleValue: rules => getRuleValue(rules, "quotes"),
    ruleValueToPrettierOption: getSingleQuote
  },
  trailingComma: {
    ruleValue: rules => getRuleValue(rules, "comma-dangle"),
    ruleValueToPrettierOption: getTrailingComma
  },
  bracketSpacing: {
    ruleValue: rules => getRuleValue(rules, "object-curly-spacing"),
    ruleValueToPrettierOption: getBracketSpacing
  },
  semi: {
    ruleValue: rules => getRuleValue(rules, "semi"),
    ruleValueToPrettierOption: getSemi
  },
  useTabs: {
    ruleValue: rules => getRuleValue(rules, "indent"),
    ruleValueToPrettierOption: getUseTabs
  }
};

/* eslint import/prefer-default-export:0 */
export { matchFileType, getOptionsForFormatting };

function matchFileType(languageName, filePath) {
  if (typeof filePath !== 'string') {
    logger.debug(`Cannot get a file type when "filePath" is not a string`);
    return false;
  }

  const lang = getSupportInfo().languages.find(language => language.name === languageName);

  if (!lang) {
    logger.debug(`prettier doesn't support "${languageName}"`);
    return false;
  }

  return lang.extensions.findIndex(ext => filePath.endsWith(ext)) !== -1;
}

function getOptionsForFormatting(
  eslintConfig,
  prettierOptions = {},
  fallbackPrettierOptions = {}
) {
  const eslint = getRelevantESLintConfig(eslintConfig);
  const prettier = getPrettierOptionsFromESLintRules(
    eslint,
    prettierOptions,
    fallbackPrettierOptions
  );
  return { eslint, prettier };
}

function getRelevantESLintConfig(eslintConfig) {
  const { rules } = eslintConfig;
  // TODO: remove rules that are not fixable for perf
  // this will require we load the config for every rule...
  // not sure that'll be worth the effort
  // but we may be able to maintain a manual list of rules that
  // are definitely not fixable. Which is what we'll do for now...
  const rulesThatWillNeverBeFixable = [
    // TODO add more
    "valid-jsdoc",
    "global-require",
    "no-with"
  ];

  logger.debug("reducing eslint rules down to relevant rules only");
  const relevantRules = Object.keys(rules).reduce(
    (rulesAccumulator, ruleName) => {
      if (rulesThatWillNeverBeFixable.indexOf(ruleName) === -1) {
        logger.trace(
          `adding to relevant rules:`,
          JSON.stringify({ [ruleName]: rules[ruleName] })
        );
        rulesAccumulator[ruleName] = rules[ruleName];
      } else {
        logger.trace(
          `omitting from relevant rules:`,
          JSON.stringify({ [ruleName]: rules[ruleName] })
        );
      }
      return rulesAccumulator;
    },
    {}
  );

  return {
    // defaults
    useEslintrc: false,
    ...eslintConfig,
    // overrides
    rules: relevantRules,
    fix: true,
    globals: [] // must be an array for some reason :-/
  };
}

/**
 * This accepts an eslintConfig object and converts
 * it to the `prettier` options object
 */
function getPrettierOptionsFromESLintRules(
  eslintConfig,
  prettierOptions,
  fallbackPrettierOptions
) {
  const { rules } = eslintConfig;

  return Object.keys(OPTION_GETTERS).reduce(
    (options, key) =>
      configureOptions(
        prettierOptions,
        fallbackPrettierOptions,
        key,
        options,
        rules
      ),
    {}
  );
}

// If an ESLint rule that prettier can be configured with is enabled create a
// prettier configuration object that reflects the ESLint rule configuration.
function configureOptions(
  prettierOptions,
  fallbackPrettierOptions,
  key,
  options,
  rules
) {
  const givenOption = prettierOptions[key];
  const optionIsGiven = givenOption !== undefined;

  if (optionIsGiven) {
    options[key] = givenOption;
  } else {
    const { ruleValue, ruleValueToPrettierOption } = OPTION_GETTERS[key];
    const eslintRuleValue = ruleValue(rules);

    options[key] = ruleValueToPrettierOption(
      eslintRuleValue,
      fallbackPrettierOptions,
      rules
    );
  }

  return options;
}

function getPrintWidth(eslintValue, fallbacks) {
  return makePrettierOption("printWidth", eslintValue, fallbacks, 80);
}

function getTabWidth(eslintValue, fallbacks) {
  return makePrettierOption("tabWidth", eslintValue, fallbacks, 2);
}

function getParser(eslintValue, fallbacks) {
  // TODO: handle flow parser config
  return makePrettierOption("parser", eslintValue, fallbacks, "babylon");
}

function getSingleQuote(eslintValue, fallbacks) {
  let prettierValue;

  if (eslintValue === "single") {
    prettierValue = true;
  } else if (eslintValue === "double") {
    prettierValue = false;
  } else if (eslintValue === "backtick") {
    prettierValue = false;
  } else {
    prettierValue = eslintValue;
  }

  return makePrettierOption("singleQuote", prettierValue, fallbacks, false);
}

function getTrailingComma(value, fallbacks, rules) {
  let prettierValue;
  const actualValue = rules["comma-dangle"];

  if (value === "never") {
    prettierValue = "none";
  } else if (value === "always") {
    prettierValue = "es5";
  } else if (typeof actualValue === "object") {
    prettierValue = getValFromTrailingCommaConfig(actualValue);
  } else {
    prettierValue = RULE_NOT_CONFIGURED;
  }

  return makePrettierOption("trailingComma", prettierValue, fallbacks, "none");
}

function getValFromTrailingCommaConfig(objectConfig) {
  const [, { arrays = "", objects = "", functions = "" }] = objectConfig;
  const fns = isAlways(functions);
  const es5 = [arrays, objects].some(isAlways);

  if (fns) {
    return "all";
  } else if (es5) {
    return "es5";
  } else {
    return "none";
  }
}

function getBracketSpacing(eslintValue, fallbacks) {
  let prettierValue;

  if (eslintValue === "never") {
    prettierValue = false;
  } else if (eslintValue === "always") {
    prettierValue = true;
  } else {
    prettierValue = eslintValue;
  }

  return makePrettierOption("bracketSpacing", prettierValue, fallbacks, true);
}

function getSemi(eslintValue, fallbacks) {
  let prettierValue;

  if (eslintValue === "never") {
    prettierValue = false;
  } else if (eslintValue === "always") {
    prettierValue = true;
  } else {
    prettierValue = eslintValue;
  }

  return makePrettierOption("semi", prettierValue, fallbacks, true);
}

function getUseTabs(eslintValue, fallbacks) {
  let prettierValue;

  if (eslintValue === "tab") {
    prettierValue = true;
  } else {
    prettierValue = RULE_NOT_CONFIGURED;
  }

  return makePrettierOption("useTabs", prettierValue, fallbacks, false);
}

function extractRuleValue(objPath, name, value) {
  if (objPath) {
    logger.trace(
      oneLine`
        Getting the value from object configuration of ${name}.
        delving into ${JSON.stringify(value)} with path "${objPath}"
      `
    );

    return delve(value, objPath, RULE_NOT_CONFIGURED);
  }

  logger.debug(
    oneLine`
      The ${name} rule is using an object configuration
      of ${JSON.stringify(value)} but prettier-eslint is
      not currently capable of getting the prettier value
      based on an object configuration for ${name}.
      Please file an issue (and make a pull request?)
    `
  );

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
    if (ruleSetting === 0 || ruleSetting === "off") {
      return RULE_DISABLED;
    }

    if (typeof value === "object") {
      return extractRuleValue(objPath, name, value);
    } else {
      logger.trace(
        oneLine`
          The ${name} rule is configured with a
          non-object value of ${value}. Using that value.
        `
      );
      return value;
    }
  }

  return RULE_NOT_CONFIGURED;
}

function isAlways(val) {
  return val.indexOf("always") === 0;
}

function makePrettierOption(
  prettierRuleName,
  prettierRuleValue,
  fallbacks,
  defaultValue
) {
  if (
    prettierRuleValue !== RULE_NOT_CONFIGURED &&
    prettierRuleValue !== RULE_DISABLED &&
    typeof prettierRuleValue !== "undefined"
  ) {
    return prettierRuleValue;
  }

  const fallback = fallbacks[prettierRuleName];
  if (typeof fallback !== "undefined") {
    logger.debug(
      oneLine`
        The ${prettierRuleName} rule is not configured,
        using provided fallback of ${fallback}
      `
    );
    return fallback;
  }

  logger.debug(
    oneLine`
      The ${prettierRuleName} rule is not configured,
      using default of ${defaultValue}
    `
  );
  return defaultValue;
}
