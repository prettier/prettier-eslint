const fs = require.requireActual("fs");
module.exports = Object.assign({}, fs, {
  readFileSync: jest.fn(filename => {
    return /package\.json$/.test(filename)
      ? '{"name": "fake", "version": "0.0.0"}'
      : "var fake = true";
  })
});
