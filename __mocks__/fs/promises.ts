import type Fs_ from 'node:fs/promises';

import { vi } from 'vitest';

const fs = await vi.importActual<typeof Fs_>('node:fs/promises');

const fsMock = {
  ...fs,
  // eslint-disable-next-line @typescript-eslint/require-await
  readFile: vi.fn(async (filename?: string) => {
    if (filename?.endsWith('package.json')) {
      return '{"name": "fake", "version": "0.0.0", "prettier": {}}';
    }
    if (/\.[jt]s$/.test(filename ?? '')) {
      return 'var fake = true';
    }

    return '';
  }),
};

export default fsMock;
