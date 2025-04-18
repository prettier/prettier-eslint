// @ts-check

/** @import { Config, Plugin } from 'prettier' */

import base from '@1stg/prettier-config/semi';
import * as jsdoc from 'prettier-plugin-jsdoc';
import * as jsdocType from 'prettier-plugin-jsdoc-type';
import * as svelte from 'prettier-plugin-svelte';

/** @type {Config} */
const config = {
  ...base,
  plugins: [
    .../** @type {Plugin[]} */ (base.plugins),
    jsdoc,
    jsdocType,
    svelte,
  ],
};

export default config;
