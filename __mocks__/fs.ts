import type Fs_ from 'node:fs';

import { vi } from 'vitest';

const fs = await vi.importActual<typeof Fs_>('node:fs');

const fsMock = {
  ...fs,
  readFileSync: vi.fn((filename?: string) => {
    if (filename?.endsWith('package.json')) {
      return '{"name": "fake", "version": "0.0.0", "prettier": {}}';
    }
    if (/\.[jt]s$/.test(filename ?? '')) {
      return 'var fake = true';
    }

    return '';
  }),
};

export const { readFileSync } = fsMock;
export default fsMock;
