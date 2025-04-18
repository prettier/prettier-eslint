"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptionsForFormatting = getOptionsForFormatting;
exports.requireModule = requireModule;
exports.getESLint = getESLint;
const tslib_1 = require("tslib");
const common_tags_1 = require("common-tags");
const dlv_1 = tslib_1.__importDefault(require("dlv"));
const eslint_1 = require("eslint");
const loglevel_colored_level_prefix_1 = tslib_1.__importDefault(require("loglevel-colored-level-prefix"));
const logger = (0, loglevel_colored_level_prefix_1.default)({ prefix: 'prettier-eslint' });
const RULE_DISABLED = {};
const RULE_NOT_CONFIGURED = 'RULE_NOT_CONFIGURED';
const ruleValueExists = (prettierRuleValue) => prettierRuleValue !== RULE_NOT_CONFIGURED &&
    prettierRuleValue !== RULE_DISABLED &&
    prettierRuleValue !== undefined;
const OPTION_GETTERS = {
    printWidth: {
        ruleValue: rules => getRuleValue(rules, 'max-len', 'code'),
        ruleValueToPrettierOption: getPrintWidth,
    },
    tabWidth: {
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
        ruleValue: rules => getRuleValue(rules, 'react/jsx-closing-bracket-location', 'nonEmpty'),
        ruleValueToPrettierOption: getBracketSameLine,
    },
    arrowParens: {
        ruleValue: rules => getRuleValue(rules, 'arrow-parens'),
        ruleValueToPrettierOption: getArrowParens,
    },
};
function getOptionsForFormatting(eslintConfig, prettierOptions = {}, fallbackPrettierOptions = {}) {
    const eslint = getRelevantESLintConfig(eslintConfig);
    const prettier = getPrettierOptionsFromESLintRules(eslintConfig, prettierOptions, fallbackPrettierOptions);
    return { eslint, prettier };
}
function getRelevantESLintConfig(eslintConfig) {
    const linter = new eslint_1.Linter();
    const rules = linter.getRules();
    logger.debug('turning off unfixable rules');
    const relevantRules = {};
    for (const [name, rule] of rules.entries()) {
        if (!rule.meta || !rule.meta.fixable) {
            logger.trace('turning off rule:', JSON.stringify({ [name]: rule }));
            relevantRules[name] = ['off'];
        }
    }
    return Object.assign(Object.assign({ useEslintrc: false }, eslintConfig), { rules: Object.assign(Object.assign({}, eslintConfig.rules), relevantRules), fix: true, globals: eslintConfig.globals || {} });
}
function getPrettierOptionsFromESLintRules(eslintConfig, prettierOptions, fallbackPrettierOptions) {
    const { rules } = eslintConfig;
    const prettierPluginOptions = getRuleValue(rules, 'prettier/prettier', []);
    if (ruleValueExists(prettierPluginOptions) &&
        typeof prettierPluginOptions === 'object') {
        prettierOptions = Object.assign(Object.assign({}, prettierPluginOptions), prettierOptions);
    }
    return Object.keys(OPTION_GETTERS).reduce((options, key) => configureOptions(prettierOptions, fallbackPrettierOptions, key, options, rules), prettierOptions);
}
function configureOptions(prettierOptions, fallbackPrettierOptions, key, options, rules) {
    const givenOption = prettierOptions[key];
    const optionIsGiven = givenOption !== undefined;
    if (optionIsGiven) {
        options[key] = givenOption;
    }
    else {
        const { ruleValue, ruleValueToPrettierOption } = OPTION_GETTERS[key];
        const eslintRuleValue = ruleValue(rules);
        const option = ruleValueToPrettierOption(eslintRuleValue, fallbackPrettierOptions, rules);
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
function getTrailingComma(eslintValue, fallbacks) {
    let prettierValue;
    if (eslintValue === 'never') {
        prettierValue = 'none';
    }
    else if (typeof eslintValue === 'string' &&
        eslintValue.startsWith('always')) {
        prettierValue = 'es5';
    }
    else if (typeof eslintValue === 'object') {
        prettierValue = getValFromTrailingCommaConfig(eslintValue);
    }
    else {
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
    }
    if (es5) {
        return 'es5';
    }
    return 'none';
}
function getBracketSpacing(eslintValue, fallbacks) {
    let prettierValue;
    if (eslintValue === 'never') {
        prettierValue = false;
    }
    else if (eslintValue === 'always') {
        prettierValue = true;
    }
    else {
        prettierValue = eslintValue;
    }
    return makePrettierOption('bracketSpacing', prettierValue, fallbacks);
}
function getSemi(eslintValue, fallbacks) {
    let prettierValue;
    if (eslintValue === 'never') {
        prettierValue = false;
    }
    else if (eslintValue === 'always') {
        prettierValue = true;
    }
    else {
        prettierValue = eslintValue;
    }
    return makePrettierOption('semi', prettierValue, fallbacks);
}
function getUseTabs(eslintValue, fallbacks) {
    const prettierValue = eslintValue === 'tab' ? true : RULE_NOT_CONFIGURED;
    return makePrettierOption('useTabs', prettierValue, fallbacks);
}
function getBracketSameLine(eslintValue, fallbacks) {
    let prettierValue;
    if (eslintValue === 'after-props') {
        prettierValue = true;
    }
    else if (eslintValue === 'tag-aligned' ||
        eslintValue === 'line-aligned' ||
        eslintValue === 'props-aligned') {
        prettierValue = false;
    }
    else {
        prettierValue = eslintValue;
    }
    return makePrettierOption('bracketSameLine', prettierValue, fallbacks);
}
function getArrowParens(eslintValue, fallbacks) {
    const prettierValue = eslintValue === 'as-needed' ? 'avoid' : eslintValue;
    return makePrettierOption('arrowParens', prettierValue, fallbacks);
}
function extractRuleValue(objPath, name, value) {
    if (objPath) {
        logger.trace((0, common_tags_1.oneLine) `
        Getting the value from object configuration of ${name}.
        delving into ${JSON.stringify(value)} with path "${objPath}"
      `);
        return (0, dlv_1.default)(value, objPath, RULE_NOT_CONFIGURED);
    }
    logger.debug((0, common_tags_1.oneLine) `
      The ${name} rule is using an object configuration
      of ${JSON.stringify(value)} but prettier-eslint is
      not currently capable of getting the prettier value
      based on an object configuration for ${name}.
      Please file an issue (and make a pull request?)
    `);
}
function getRuleValue(rules = {}, name, objPath) {
    const ruleConfig = rules[name];
    if (Array.isArray(ruleConfig)) {
        const [ruleSetting, value] = ruleConfig;
        if (ruleSetting === 0 || ruleSetting === 'off') {
            return RULE_DISABLED;
        }
        if (value != null && typeof value === 'object') {
            return extractRuleValue(objPath, name, value);
        }
        logger.trace((0, common_tags_1.oneLine) `
          The ${name} rule is configured with a
          non-object value of ${value}. Using that value.
        `);
        return value;
    }
    return RULE_NOT_CONFIGURED;
}
function isAlways(val) {
    return val.startsWith('always');
}
function makePrettierOption(prettierRuleName, prettierRuleValue, fallbacks) {
    if (ruleValueExists(prettierRuleValue)) {
        return prettierRuleValue;
    }
    const fallback = fallbacks[prettierRuleName];
    if (fallback !== undefined) {
        logger.debug((0, common_tags_1.oneLine) `
        The ${prettierRuleName} rule is not configured,
        using provided fallback of ${fallback}
      `);
        return fallback;
    }
    logger.debug((0, common_tags_1.oneLine) `
      The ${prettierRuleName} rule is not configured,
      let prettier decide
    `);
}
function requireModule(modulePath, name) {
    try {
        logger.trace(`requiring "${name}" module at "${modulePath}"`);
        return require(modulePath);
    }
    catch (error) {
        logger.error((0, common_tags_1.oneLine) `
      There was trouble getting "${name}".
      Is "${modulePath}" a correct path to the "${name}" module?
    `);
        throw error;
    }
}
function getESLint(eslintPath, eslintOptions) {
    const { ESLint } = requireModule(eslintPath, 'eslint');
    try {
        return new ESLint(eslintOptions);
    }
    catch (error) {
        logger.error('There was trouble creating the ESLint CLIEngine.');
        throw error;
    }
}
//# sourceMappingURL=utils.js.map