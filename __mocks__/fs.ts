import type Fs_ from 'node:fs';

type Fs = typeof Fs_;

const fs = jest.requireActual<Fs>('fs');

// eslint-disable-next-line prefer-object-spread -- typing issue
export = Object.assign({}, fs, {
  readFileSync: jest.fn((filename: string) => {
    if (filename.endsWith('package.json')) {
      return '{"name": "fake", "version": "0.0.0", "prettier": {}}';
    }
    if (/\.[jt]s$/.test(filename)) {
      return 'var fake = true';
    }

    return '';
  }),
});
