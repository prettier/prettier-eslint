import { analyze, format } from './lib/index.js';

namespace prettierESLint {
  type Format = typeof format;

  interface PrettierESLint extends Format {
    analyze: typeof analyze;
    format: Format;
  }
}

declare const prettierESLint: prettierESLint.PrettierESLint;

export = prettierESLint;
