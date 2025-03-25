import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import ts from 'rollup-plugin-typescript2';
import typescript from 'typescript';

export default [{
  input: 'src/index.ts',
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
  external: [/node_modules/],
  plugins: [

    nodeResolve({ preferBuiltins: true }),
    ts({
      useTsconfigDeclarationDir: true,
      sourceMap: false,
      typescript
    }),
    commonjs(),

    json(),
  ],
},
  {
    input: './dts/index.d.ts',
    output: [{ file: './types/index.d.ts', format: 'es' }],
    plugins: [dts()]
  }
];
