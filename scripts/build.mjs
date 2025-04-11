import path from 'node:path';
import fs from 'node:fs/promises';
import * as esbuild from 'esbuild';
import packageJson from '../package.json' with { type: 'json' };

await fs.rm(new URL('../dist/', import.meta.url), {
  recursive: true,
  force: true,
});

await Promise.all(
  [
    { format: 'esm', extension: '.mjs' },
    { format: 'cjs', extension: '.cjs' },
  ].map(({ format, extension }) =>
    esbuild.build({
      entryPoints: [path.join(import.meta.dirname, '../src/index.mjs')],
      bundle: true,
      platform: 'node',
      external: Object.keys(packageJson.dependencies),
      format,
      outdir: path.join(import.meta.dirname, `../dist/`),
      outExtension: { '.js': extension },
      banner:
        format === 'esm'
          ? {
              js: `
import {createRequire} from 'module';
const require = createRequire(import.meta.url);
`,
            }
          : undefined,
    }),
  ),
);
