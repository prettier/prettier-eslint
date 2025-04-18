import fs from 'node:fs';
import eslint, { ESLint } from 'eslint';
import prettier from 'prettier';
import { ESLintConfig } from 'prettier-eslint';

// prettier-ignore
export interface FsMock extends (typeof fs) {
  readFileSync: jest.Mock<string, [string?]>;
}

export type ESLintCalculateConfigForFile = ESLint['calculateConfigForFile'];
export type ESLintLintText = ESLint['lintText'];

export interface MockESLint extends ESLint {
  _originalLintText: ESLintLintText;
}

export interface ThrowError {
  throwError?: Error | null;
}

// prettier-ignore
export interface ESLintMock extends (typeof eslint) {
  ESLint: jest.Mock<MockESLint>;
  mock: {
    calculateConfigForFile: jest.Mock<
      Promise<ESLintConfig>,
      Parameters<ESLintCalculateConfigForFile>
    >;
    lintText: jest.Mock<
      ReturnType<ESLintLintText>,
      Parameters<ESLintLintText>
    > &
      ThrowError;
  };
}

// prettier-ignore
export interface PrettierMock extends (typeof prettier) {
  format: jest.Mock<
    ReturnType<typeof prettier.format>,
    Parameters<typeof prettier.format>
  > &
    ThrowError;
  resolveConfig: jest.Mock<
    ReturnType<typeof prettier.resolveConfig>,
    Parameters<typeof prettier.resolveConfig>
  > &
    ThrowError;
}
