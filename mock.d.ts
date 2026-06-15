import fs from 'node:fs/promises';

import eslint, { ESLint } from 'eslint';
import prettier from 'prettier';
import { type Mock } from 'vitest';

type Fs = typeof fs;

export interface FsMock extends Fs {
  readFile: Mock<(filename?: string) => Promise<string>>;
}

export type ESLintCalculateConfigForFile = ESLint['calculateConfigForFile'];
export type ESLintLintText = ESLint['lintText'];

export interface MockESLint extends ESLint {
  _originalLintText: ESLintLintText;
}

export interface ThrowError {
  throwError?: Error | null;
}

type ESLintType = typeof eslint;

// prettier-ignore
export interface ESLintMock extends ESLintType {
  ESLint: Mock<(options: ESLint.Options) => MockESLint>;
  mock: {
    calculateConfigForFile: Mock<ESLintCalculateConfigForFile> & ThrowError;
    lintText: Mock<ESLintLintText> & ThrowError;
  };
}

type Prettier = typeof prettier;

export interface PrettierMock extends Prettier {
  format: Mock<typeof prettier.format> & ThrowError;
  resolveConfig: Mock<typeof prettier.resolveConfig> & ThrowError;
}
