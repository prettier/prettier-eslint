const fs = require.requireActual("fs");
module.exports = Object.assign({}, fs, {
  readFileSync: jest.fn(filename => {
    if (/package\.json$/.test(filename)) {
      return '{"name": "fake", "version": "0.0.0"}';
    } else if (/\.(j|t)s$/.test(filename)) {
      return "var fake = true";
    }

    return "";
  })
});
