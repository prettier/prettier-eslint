import {
  FormatOptions as FormatOptions_,
  analyze,
  format,
} from './lib/index.js';

declare namespace prettierESLint {
  type Format = typeof format;

  // eslint-disable-next-line no-restricted-syntax
  type FormatOptions = FormatOptions_;

  interface PrettierESLint extends Format {
    analyze: typeof analyze;
    format: Format;
  }
}

declare const prettierESLint: prettierESLint.PrettierESLint;

export = prettierESLint;
