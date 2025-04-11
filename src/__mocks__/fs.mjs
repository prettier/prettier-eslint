// This follows the advice of the Vitest Mocking guide, and mocks the full
// filesystem with an in-memory replacement.
// https://vitest.dev/guide/mocking#file-system
const { createFsFromVolume, memfs, Volume } = require('memfs');
import path from 'node:path';

const files = [
  'foo.js',
  'package.json',
  'node_modules/eslint/index.js',
  'node_modules/prettier/index.js',
];

const volume = new Volume();

volume.fromJSON(
  Object.fromEntries(
    files.map(file => {
      return [`./${file}`, `.tests/fixtures/paths/${file}`];
    }),
  ),
  `${path.dirname(__filename)}/../../tests/fixtures/paths`,
);

export default createFsFromVolume(volume);
