// @ts-check

/** @import { Config, Plugin } from 'prettier' */

import base from '@1stg/prettier-config/semi';
import svelte from 'prettier-plugin-svelte';

/** @type {Config} */
const config = {
  ...base,
  plugins: [.../** @type {Plugin[]} */ (base.plugins), svelte],
};

export default config;
