import autoExternal from 'rollup-plugin-auto-external';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.mjs',
  output: [
    {
      file: 'dist/cjs/index.js',
      format: 'cjs',
      name: 'cjs-bundle',
    },
    {
      file: 'dist/esm/index.js',
      format: 'esm',
      name: 'esm-bundle',
    },
  ],
  external: ['fs', 'node:path'],
  plugins: [
    autoExternal(),
    commonjs({
      include: /node_modules/,
      requireReturnsDefault: 'auto',
      strictRequires: 'debug',
    }),
    nodeResolve({ preferBuiltins: true }),
    json(),
  ],
};
