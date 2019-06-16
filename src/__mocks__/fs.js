const fs = require.requireActual('fs');
module.exports = {
  ...fs,
  readFileSync: jest.fn(filename => {
    if (/package\.json$/.test(filename)) {
      return '{"name": "fake", "version": "0.0.0", "prettier": {}}';
    } else if (/\.(j|t)s$/.test(filename)) {
      return 'var fake = true';
    }

    return '';
  })
};
