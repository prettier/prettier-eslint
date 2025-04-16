const fs = jest.requireActual('fs');

module.exports = {
  ...fs,
  readFileSync: jest.fn(filename => {
    if (/package\.json$/.test(filename)) {
      return '{"name": "fake", "version": "0.0.0", "prettier": {}}';
    }
    if (/\.[jt]s$/.test(filename)) {
      return 'var fake = true';
    }

    return '';
  }),
};
