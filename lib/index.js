"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = format;
exports.analyze = analyze;
const tslib_1 = require("tslib");
const node_fs_1 = tslib_1.__importDefault(require("node:fs"));
const node_path_1 = tslib_1.__importDefault(require("node:path"));
const common_tags_1 = require("common-tags");
const indent_string_1 = tslib_1.__importDefault(require("indent-string"));
const lodash_merge_1 = tslib_1.__importDefault(require("lodash.merge"));
const loglevel_colored_level_prefix_1 = tslib_1.__importDefault(require("loglevel-colored-level-prefix"));
const pretty_format_1 = require("pretty-format");
const require_relative_1 = tslib_1.__importDefault(require("require-relative"));
const utils_ts_1 = require("./utils.js");
const logger = (0, loglevel_colored_level_prefix_1.default)({ prefix: 'prettier-eslint' });
function format(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { output } = yield analyze(options);
        return output;
    });
}
function analyze(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const { logLevel = getDefaultLogLevel() } = options;
        logger.setLevel(logLevel);
        logger.trace('called analyze with options:', (0, pretty_format_1.format)(options));
        const { filePath, text = getTextFromFilePath(filePath), eslintPath = getModulePath(filePath, 'eslint'), prettierPath = getModulePath(filePath, 'prettier'), prettierLast, fallbackPrettierOptions, } = options;
        const eslintConfig = (0, lodash_merge_1.default)({}, options.eslintConfig, yield getESLintConfig(filePath, eslintPath, options.eslintConfig || {}));
        const prettierOptions = (0, lodash_merge_1.default)({}, filePath ? { filepath: filePath } : { parser: 'babel' }, yield getPrettierConfig(filePath, prettierPath), options.prettierOptions);
        const formattingOptions = (0, utils_ts_1.getOptionsForFormatting)(eslintConfig, prettierOptions, fallbackPrettierOptions);
        logger.debug('inferred options:', (0, pretty_format_1.format)({
            filePath,
            text,
            eslintPath,
            prettierPath,
            eslintConfig: formattingOptions.eslint,
            prettierOptions: formattingOptions.prettier,
            logLevel,
            prettierLast,
        }));
        const eslintExtensions = eslintConfig.extensions || [
            '.cjs',
            '.cts',
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.mjs',
            '.mts',
            '.vue',
            '.svelte',
        ];
        const fileExtension = node_path_1.default.extname(filePath || '');
        const onlyPrettier = filePath
            ? !eslintExtensions.includes(fileExtension)
            : false;
        const prettify = createPrettify(formattingOptions.prettier, prettierPath);
        if (onlyPrettier) {
            return prettify(text);
        }
        if (['.ts', '.tsx'].includes(fileExtension)) {
            (_a = formattingOptions.eslint).parser || (_a.parser = require.resolve('@typescript-eslint/parser'));
        }
        if (['.vue'].includes(fileExtension)) {
            (_b = formattingOptions.eslint).parser || (_b.parser = require.resolve('vue-eslint-parser'));
        }
        if (['.svelte'].includes(fileExtension)) {
            (_c = formattingOptions.eslint).parser || (_c.parser = require.resolve('svelte-eslint-parser'));
        }
        const eslintFix = createEslintFix(formattingOptions.eslint, eslintPath);
        if (prettierLast) {
            const eslintFixed = yield eslintFix(text, filePath);
            return prettify(eslintFixed);
        }
        const { output } = yield prettify(text);
        return eslintFix(output, filePath);
    });
}
function createPrettify(formatOptions, prettierPath) {
    return function prettify(param) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let text = param;
            let messages = [];
            if (typeof text !== 'string') {
                messages = text.messages;
                text = text.output;
            }
            logger.debug('calling prettier on text');
            logger.trace((0, common_tags_1.stripIndent) `
      prettier input:

      ${(0, indent_string_1.default)(text, 2)}
    `);
            const prettier = (0, utils_ts_1.requireModule)(prettierPath, 'prettier');
            try {
                logger.trace('calling prettier.format with the text and prettierOptions');
                const output = yield prettier.format(text, formatOptions);
                logger.trace('prettier: output === input', output === text);
                logger.trace((0, common_tags_1.stripIndent) `
        prettier output:

        ${(0, indent_string_1.default)(output, 2)}
      `);
                return { output, messages };
            }
            catch (error) {
                logger.error('prettier formatting failed due to a prettier error');
                throw error;
            }
        });
    };
}
function createEslintFix(eslintConfig, eslintPath) {
    return function eslintFix(text, filePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(eslintConfig.globals)) {
                const tempGlobals = {};
                for (const g of eslintConfig.globals) {
                    const [key, value] = g.split(':');
                    tempGlobals[key] = value;
                }
                eslintConfig.globals = tempGlobals;
            }
            eslintConfig.overrideConfig = Object.assign({ rules: eslintConfig.rules, parser: eslintConfig.parser, globals: eslintConfig.globals, parserOptions: eslintConfig.parserOptions, ignorePatterns: eslintConfig.ignorePatterns || eslintConfig.ignorePattern, plugins: eslintConfig.plugins, env: eslintConfig.env, settings: eslintConfig.settings, noInlineConfig: eslintConfig.noInlineConfig }, eslintConfig.overrideConfig);
            delete eslintConfig.rules;
            delete eslintConfig.parser;
            delete eslintConfig.parserOptions;
            delete eslintConfig.globals;
            delete eslintConfig.ignorePatterns;
            delete eslintConfig.ignorePattern;
            delete eslintConfig.plugins;
            delete eslintConfig.env;
            delete eslintConfig.noInlineConfig;
            delete eslintConfig.settings;
            const eslint = (0, utils_ts_1.getESLint)(eslintPath, eslintConfig);
            try {
                logger.trace('calling cliEngine.executeOnText with the text');
                const report = yield eslint.lintText(text, {
                    filePath,
                    warnIgnored: true,
                });
                logger.trace('executeOnText returned the following report:', (0, pretty_format_1.format)(report));
                const [{ output = text, messages }] = report;
                logger.trace('eslint --fix: output === input', output === text);
                logger.trace((0, common_tags_1.stripIndent) `
        eslint --fix output:

        ${(0, indent_string_1.default)(output, 2)}
      `);
                return { output, messages };
            }
            catch (error) {
                logger.error('eslint fix failed due to an eslint error');
                throw error;
            }
        });
    };
}
function getTextFromFilePath(filePath) {
    try {
        logger.trace((0, common_tags_1.oneLine) `
        attempting fs.readFileSync to get
        the text for file at "${filePath}"
      `);
        return node_fs_1.default.readFileSync(filePath, 'utf8');
    }
    catch (error) {
        logger.error((0, common_tags_1.oneLine) `
        failed to get the text to format
        from the given filePath: "${filePath}"
      `);
        throw error;
    }
}
function getESLintApiOptions(eslintConfig) {
    return {
        ignore: eslintConfig.ignore || true,
        ignorePath: eslintConfig.ignorePath,
        allowInlineConfig: eslintConfig.allowInlineConfig || true,
        baseConfig: eslintConfig.baseConfig,
        overrideConfig: eslintConfig.overrideConfig,
        overrideConfigFile: eslintConfig.overrideConfigFile,
        plugins: eslintConfig.plugins,
        resolvePluginsRelativeTo: eslintConfig.resolvePluginsRelativeTo,
        rulePaths: eslintConfig.rulePaths || [],
        useEslintrc: eslintConfig.useEslintrc || true,
    };
}
function getESLintConfig(filePath, eslintPath, eslintConfig) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (filePath) {
            eslintConfig.cwd = node_path_1.default.dirname(filePath);
        }
        logger.trace((0, common_tags_1.oneLine) `
      creating ESLint CLI Engine to get the config for
      "${filePath || process.cwd()}"
    `);
        const eslint = (0, utils_ts_1.getESLint)(eslintPath, getESLintApiOptions(eslintConfig));
        try {
            logger.debug(`getting eslint config for file at "${filePath}"`);
            const config = (yield eslint.calculateConfigForFile(filePath));
            logger.trace(`eslint config for "${filePath}" received`, (0, pretty_format_1.format)(config));
            return Object.assign(Object.assign({}, eslintConfig), config);
        }
        catch (_a) {
            logger.debug('Unable to find config');
            return { rules: {} };
        }
    });
}
function getPrettierConfig(filePath, prettierPath) {
    const prettier = (0, utils_ts_1.requireModule)(prettierPath, 'prettier');
    return prettier.resolveConfig(filePath);
}
function getModulePath(filePath = __filename, moduleName) {
    try {
        return require_relative_1.default.resolve(moduleName, filePath);
    }
    catch (err) {
        const error = err;
        logger.debug((0, common_tags_1.oneLine) `
        There was a problem finding the ${moduleName}
        module. Using prettier-eslint's version.
      `, error.message, error.stack);
        return require.resolve(moduleName);
    }
}
function getDefaultLogLevel() {
    return process.env.LOG_LEVEL || 'warn';
}
tslib_1.__exportStar(require("./utils.js"), exports);
exports.default = { format, analyze };
//# sourceMappingURL=index.js.map