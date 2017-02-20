const fs = require.requireActual('fs')
module.exports = Object.assign({}, fs, {
  readFileSync: jest.fn(() => 'var fake = true'),
})
