import { oneLine } from 'common-tags';
import delve from 'dlv';
import { Linter } from 'eslint';
import getLogger from 'loglevel-colored-level-prefix';
import { type Options as PrettierOptions } from 'prettier';

import type { ESLintOptions, ESLintConfig, OptionGetter } from './types.ts';

const logger = getLogger({ prefix: 'prettier-eslint' });

const RULE_DISABLED = {} as Linter.RuleEntry;
const RULE_NOT_CONFIGURED = 'RULE_NOT_CONFIGURED';

/**
 * Checks if a given Prettier rule value is valid and configured.
 *
 * This function determines whether the provided Prettier rule value is set and
 * valid. It considers values as non-existent if they are `RULE_NOT_CONFIGURED`,
 * `RULE_DISABLED`, or `undefined`.
 *
 * @example
 *   console.log(ruleValueExists('always')); // Output: true
 *   console.log(ruleValueExists(RULE_DISABLED)); // Output: false
 *   console.log(ruleValueExists(undefined)); // Output: false
 *
 * @param prettierRuleValue - The value of the Prettier rule to check.
 * @returns `true` if the rule value exists and is valid, otherwise `false`.
 */
const ruleValueExists = (prettierRuleValue: unknown) =>
  prettierRuleValue !== RULE_NOT_CONFIGURED &&
  prettierRuleValue !== RULE_DISABLED &&
  prettierRuleValue !== undefined;

const OPTION_GETTERS: Record<keyof PrettierOptions, OptionGetter> = {
  printWidth: {
    ruleValue: rules => getRuleValue(rules, 'max-len', 'code'),
    ruleValueToPrettierOption: getPrintWidth,
  },
  tabWidth: {
    // eslint-disable-next-line sonarjs/function-return-type -- doesn't it?
    ruleValue(rules) {
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

/**
 * Extracts and prepares formatting options for ESLint and Prettier.
 *
 * This function retrieves relevant ESLint options and converts applicable
 * ESLint rules into Prettier options. It ensures Prettier settings are derived
 * correctly, using the provided options or fallback values if necessary.
 *
 * @example
 *   const eslintOptions: Linter.Config = {
 *     rules: { semi: ['error', 'always'] },
 *   };
 *   const formattingOptions = getOptionsForFormatting(eslintOptions);
 *   console.log(formattingOptions);
 *
 * @param eslintConfig - The ESLint options.
 * @param prettierOptions - The Prettier options. Default is `{}`
 * @param fallbackPrettierOptions - The fallback Prettier options if values are
 *   missing. Default is `{}`
 * @returns An object containing both the ESLint and Prettier options.
 */
export function getOptionsForFormatting(
  eslintConfig: ESLintConfig,
  prettierOptions: PrettierOptions = {},
  fallbackPrettierOptions: PrettierOptions = {},
) {
  const eslint = getRelevantESLintConfig(eslintConfig);
  const prettier = getPrettierOptionsFromESLintRules(
    eslintConfig,
    prettierOptions,
    fallbackPrettierOptions,
  );
  return { eslint, prettier };
}

/**
 * Retrieves a sanitized ESLint options by disabling unfixable rules.
 *
 * This function processes the provided ESLint options, identifying rules that
 * cannot be automatically fixed and disabling them. It then returns an updated
 * options with `fix: true` to enable automatic fixing.
 *
 * @example
 *   const eslintOptions: ESLint.Options = {
 *     baseConfig: {
 *       rules: { semi: ['error', 'always'], 'no-debugger': ['error'] },
 *     },
 *   };
 *   const sanitizedOptions = getRelevantESLintOptions(eslintOptions);
 *   console.log(sanitizedOptions);
 *
 * @param eslintConfig - The original ESLint options
 * @returns An object containing the modified ESLint options with unfixable
 *   rules disabled.
 */
function getRelevantESLintConfig(eslintConfig: ESLintConfig): ESLintConfig {
  const linter = new Linter();
  const rules = linter.getRules();
  logger.debug('turning off unfixable rules');

  const relevantRules: Linter.RulesRecord = {};

  for (const [name, rule] of rules.entries()) {
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain -- test coverage
    if (!rule.meta || !rule.meta.fixable) {
      logger.trace('turning off rule:', JSON.stringify({ [name]: rule }));
      relevantRules[name] = ['off'];
    }
  }

  return {
    // defaults
    useEslintrc: false,
    ...eslintConfig,
    // overrides
    rules: { ...eslintConfig.rules, ...relevantRules },
    fix: true,
    globals: eslintConfig.globals || {},
  };
}

/**
 * Converts an ESLint options into Prettier options.
 *
 * This function extracts relevant ESLint rules and maps them to equivalent
 * Prettier options. It also merges any explicitly configured Prettier rules
 * from `prettier/prettier` in the ESLint options.
 *
 * @example
 *   const eslintOptions: Linter.Config = {
 *     rules: { 'prettier/prettier': ['error', { semi: false }] },
 *   };
 *   const prettierOptions = getPrettierOptionsFromESLintRules(
 *     eslintOptions,
 *     {},
 *     {},
 *   );
 *   console.log(prettierOptions); // Output: { semi: false }
 *
 * @param eslintConfig - The ESLint config
 * @param prettierOptions - The Prettier options to be applied.
 * @param fallbackPrettierOptions - Fallback options for Prettier.
 * @returns A Prettier options object derived from the ESLint options.
 */
function getPrettierOptionsFromESLintRules(
  eslintConfig: ESLintConfig,
  prettierOptions: PrettierOptions,
  fallbackPrettierOptions: PrettierOptions,
) {
  const { rules } = eslintConfig;

  const prettierPluginOptions = getRuleValue(rules, 'prettier/prettier', []);

  if (
    ruleValueExists(prettierPluginOptions) &&
    typeof prettierPluginOptions === 'object'
  ) {
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
  prettierOptions: PrettierOptions,
  fallbackPrettierOptions: PrettierOptions,
  key: keyof PrettierOptions,
  options: PrettierOptions,
  rules?: Partial<Linter.RulesRecord>,
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

/** Converts ESLint rule values into Prettier options */
function getPrintWidth(eslintValue: unknown, fallbacks: PrettierOptions) {
  return makePrettierOption('printWidth', eslintValue, fallbacks);
}

function getTabWidth(eslintValue: unknown, fallbacks: PrettierOptions) {
  return makePrettierOption('tabWidth', eslintValue, fallbacks);
}

function getSingleQuote(eslintValue: unknown, fallbacks: PrettierOptions) {
  let prettierValue: unknown;

  switch (eslintValue) {
    case 'single': {
      prettierValue = true;
      break;
    }
    case 'double':
    case 'backtick': {
      prettierValue = false;
      break;
    }
    default: {
      prettierValue = eslintValue;
    }
  }

  return makePrettierOption('singleQuote', prettierValue, fallbacks);
}

function getTrailingComma(eslintValue: unknown, fallbacks: PrettierOptions) {
  let prettierValue: StringLiteral<typeof RULE_NOT_CONFIGURED>;

  if (eslintValue === 'never') {
    prettierValue = 'none';
  } else if (
    typeof eslintValue === 'string' &&
    eslintValue.startsWith('always')
  ) {
    prettierValue = 'es5';
  } else if (typeof eslintValue === 'object') {
    prettierValue = getValFromTrailingCommaConfig(
      eslintValue as Record<'arrays' | 'functions' | 'objects', string>,
    );
  } else {
    prettierValue = RULE_NOT_CONFIGURED;
  }

  return makePrettierOption('trailingComma', prettierValue, fallbacks);
}

/**
 * Determines the correct Prettier option for `trailingComma` based on ESLint
 * config.
 *
 * @param objectConfig - ESLint rule configuration for trailing commas.
 * @returns - The corresponding Prettier trailingComma value.
 */
function getValFromTrailingCommaConfig(
  objectConfig: Record<'arrays' | 'functions' | 'objects', string>,
) {
  const { arrays = '', objects = '', functions = '' } = objectConfig;
  const fns = isAlways(functions);
  const es5 = [arrays, objects].some(isAlways);

  if (fns) {
    return 'all';
  }
  if (es5) {
    return 'es5';
  }
  return 'none';
}

function getBracketSpacing(eslintValue: unknown, fallbacks: PrettierOptions) {
  let prettierValue: unknown;

  if (eslintValue === 'never') {
    prettierValue = false;
  } else if (eslintValue === 'always') {
    prettierValue = true;
  } else {
    prettierValue = eslintValue;
  }

  return makePrettierOption('bracketSpacing', prettierValue, fallbacks);
}

function getSemi(eslintValue: unknown, fallbacks: PrettierOptions) {
  let prettierValue: unknown;

  if (eslintValue === 'never') {
    prettierValue = false;
  } else if (eslintValue === 'always') {
    prettierValue = true;
  } else {
    prettierValue = eslintValue;
  }

  return makePrettierOption('semi', prettierValue, fallbacks);
}

function getUseTabs(eslintValue: unknown, fallbacks: PrettierOptions) {
  const prettierValue = eslintValue === 'tab' ? true : RULE_NOT_CONFIGURED;

  return makePrettierOption('useTabs', prettierValue, fallbacks);
}

function getBracketSameLine(eslintValue: unknown, fallbacks: PrettierOptions) {
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

function getArrowParens(eslintValue: unknown, fallbacks: PrettierOptions) {
  const prettierValue = eslintValue === 'as-needed' ? 'avoid' : eslintValue;

  return makePrettierOption('arrowParens', prettierValue, fallbacks);
}

/**
 * Extracts a nested rule value from an ESLint rule object.
 *
 * This function attempts to retrieve a specific value from an object-based
 * ESLint rule configuration. If the requested value cannot be inferred, it logs
 * a debug message and returns `undefined`.
 *
 * @example
 *   const eslintRuleConfig = { maxLen: { code: 80 } };
 *   console.log(
 *     extractRuleValue('code', 'max-len', eslintRuleConfig.maxLen),
 *   ); // Output: 80
 *
 * @param objPath - The path to the nested value in the rule configuration.
 * @param name - The name of the ESLint rule.
 * @param value - The ESLint rule configuration object.
 * @returns The extracted value from the ESLint rule configuration or
 *   `RULE_NOT_CONFIGURED` if not found.
 */
function extractRuleValue(
  objPath: Array<number | string> | string | undefined,
  name: string,
  value: object,
): StringLiteral<Linter.RuleEntry> | undefined {
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

    return delve(value, objPath, RULE_NOT_CONFIGURED) as
      | StringLiteral<Linter.RuleEntry>
      | undefined;
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
}

/**
 * Extracts a rule value from an ESLint configuration.
 *
 * This function retrieves the value of a specified ESLint rule. If the rule is
 * disabled (`0` or `'off'`), it returns `RULE_DISABLED`. If the rule is
 * configured with an object, it extracts the value from the given path.
 * Otherwise, it logs and returns the rule's direct value.
 *
 * @example
 *   const rules = { semi: ['error', 'always'], quotes: ['off'] };
 *   console.log(getRuleValue(rules, 'semi', 'style')); // Output: 'always'
 *   console.log(getRuleValue(rules, 'quotes', 'style')); // Output: RULE_DISABLED
 *
 * @param rules - The ESLint rules configuration.
 * @param name - The name of the ESLint rule to retrieve.
 * @param objPath - The object path used to extract values when the rule is an
 *   object.
 * @returns The extracted rule value, `RULE_DISABLED` if the rule is off, or
 *   `RULE_NOT_CONFIGURED` if unset.
 */
function getRuleValue(
  /* istanbul ignore next */
  rules: Partial<Linter.RulesRecord> = {},
  name: string,
  objPath?: Array<number | string> | string,
): StringLiteral<Linter.RuleEntry> | undefined {
  const ruleConfig = rules[name] as Linter.RuleEntry<unknown[]>;

  if (Array.isArray(ruleConfig)) {
    const [ruleSetting, value] = ruleConfig;

    // If `ruleSetting` is set to disable the ESLint rule don't use `value` as
    // it might be a value provided by an overridden config package e.g. airbnb
    // overridden by config-prettier. The airbnb values are provided even though
    // config-prettier disables the rule. Instead use fallback or prettier
    // default.
    if (ruleSetting === 0 || ruleSetting === 'off') {
      return RULE_DISABLED;
    }

    if (value != null && typeof value === 'object') {
      return extractRuleValue(objPath, name, value);
    }
    logger.trace(
      oneLine`
          The ${name} rule is configured with a
          non-object value of ${value}. Using that value.
        `,
    );
    return value as StringLiteral<Linter.RuleEntry>;
  }

  return RULE_NOT_CONFIGURED;
}

/**
 * Checks if a given string starts with the word "always".
 *
 * This function determines whether the provided value begins with the substring
 * `"always"`.
 *
 * @example
 *   console.log(isAlways('alwaysStrict')); // Output: true
 *   console.log(isAlways('neverStrict')); // Output: false
 *
 * @param val - The string to check.
 * @returns `true` if the string starts with `"always"`, otherwise `false`.
 */
function isAlways(val: string) {
  return val.startsWith('always');
}

/**
 * Determines the appropriate Prettier option value based on rule configuration
 * and fallbacks.
 *
 * This function first checks if a specific Prettier rule is explicitly
 * configured. If not, it attempts to use a provided fallback value. If no
 * fallback exists, Prettier is allowed to use its default behavior.
 *
 * @example
 *   const fallbacks = { semi: false, singleQuote: true };
 *   const semiOption = makePrettierOption('semi', undefined, fallbacks);
 *   console.log(semiOption); // Output: false (fallback value)
 *
 * @param prettierRuleName - The name of the Prettier rule.
 * @param prettierRuleValue - The configured value for the Prettier rule.
 * @param fallbacks - An object containing fallback values for Prettier rules.
 * @returns The determined Prettier rule value or `undefined` if not configured.
 */
function makePrettierOption(
  prettierRuleName: keyof PrettierOptions,
  prettierRuleValue: unknown,
  fallbacks: PrettierOptions,
) {
  if (ruleValueExists(prettierRuleValue)) {
    return prettierRuleValue;
  }

  const fallback = fallbacks[prettierRuleName];
  if (fallback !== undefined) {
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
}

export function requireModule<T>(modulePath: string, name: string) {
  try {
    logger.trace(`requiring "${name}" module at "${modulePath}"`);
    return require(modulePath) as T; // eslint-disable-line @typescript-eslint/no-require-imports, sonarjs/todo-tag -- TODO: Use `import()` instead
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

export function getESLint(eslintPath: string, eslintOptions: ESLintOptions) {
  const { ESLint } = requireModule<typeof import('eslint')>(
    eslintPath,
    'eslint',
  );
  try {
    return new ESLint(eslintOptions);
  } catch (error) {
    logger.error('There was trouble creating the ESLint CLIEngine.');
    throw error;
  }
}

export type StringLiteral<T> = T | (string & { _?: never });
