import { ESLint as ActualESLint } from 'eslint'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'

const eslintPath = fileURLToPath(import.meta.url)

const mockCalculateConfigForFileSpy = createMockFunction(mockCalculateConfigForFile)
mockCalculateConfigForFileSpy.overrides = {}
const mockLintTextSpy = createMockFunction(mockLintText)

export class ESLint {
  instance

  constructor(...args) {
    globalThis.__PRETTIER_ESLINT_TEST_STATE__ = {
      eslintPath,
    }
    this.instance = new ActualESLint(...args)
    this.instance.calculateConfigForFile = mockCalculateConfigForFileSpy
    this.instance._originalLintText = this.instance.lintText
    this.instance.lintText = mockLintTextSpy
  }
}

Object.setPrototypeOf(ESLint, ActualESLint)

export const mock = {
  calculateConfigForFile: mockCalculateConfigForFileSpy,
  lintText: mockLintTextSpy,
}

function createMockFunction(implementation){
  const mockFn = (...args) => implementation(...args)
  mockFn.throwError = null

  return new Proxy(mockFn, {
    apply(target, thisArg, args) {
      if (target.throwError) {
        throw target.throwError
      }
      return Reflect.apply(target, thisArg, args)
    },
  })
}

function mockCalculateConfigForFile(filePath) {
  if (!filePath) {
    return { rules: {} }
  }
  if (filePath.includes('eslint.config')) {
    return {
      rules: {
        semi: [2, 'never'],
        'max-len': [2, 120, 2],
        indent: [2, 2, { SwitchCase: 1 }],
        quotes: [2, 'single', { avoidEscape: true, allowTemplateLiterals: true }],
        'comma-dangle': [
          2,
          {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            functions: 'always-multiline',
          },
        ],
        'arrow-parens': [2, 'as-needed'],
      },
    }
  } else if (filePath.includes('fixtures/paths')) {
    return { rules: {} }
  } else {
    throw new Error(
      `Your mock filePath (${filePath}) does not have a handler for finding the config`,
    )
  }
}

function mockLintText(...args) {
  return this._originalLintText(...args)
}
