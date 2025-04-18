import {analyze, format} from './lib/index.js'

export interface PrettierESLint extends (typeof format) {
  analyze: typeof analyze,
  format: typeof format,
}
