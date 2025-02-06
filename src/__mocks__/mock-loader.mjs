import path, { dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MOCK_ESLINT_PATH = pathToFileURL(path.join(__dirname,'../__mocks__/eslint.mjs')).href

export function resolve(specifier, context, defaultResolve) {
  if (specifier === 'eslint') {
    return {
      url: MOCK_ESLINT_PATH,
      shortCircuit: true,
    }
  }
  return defaultResolve(specifier, context, defaultResolve)
}

export async function load(url, context, defaultLoad) {

  console.log('############################################', url)
  if (url === MOCK_ESLINT_PATH) {
    const source = await readFile(new URL(url), 'utf-8')
    return {
      format: 'module',
      source,
    }
  }
  return defaultLoad(url, context, defaultLoad)
}
