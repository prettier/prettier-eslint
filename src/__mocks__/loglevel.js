const logger = {
  setLevel: jest.fn(),
  trace: jest.fn(getTestImplementation('trace')),
  debug: jest.fn(getTestImplementation('debug')),
  info: jest.fn(getTestImplementation('info')),
  warn: jest.fn(getTestImplementation('warn')),
  error: jest.fn(getTestImplementation('error')),
}
const mock = {clearAll, logger, logThings: []}
module.exports = {getLogger: jest.fn(getLogger), mock}

function getLogger() {
  return logger
}

function clearAll() {
  Object.keys(logger).forEach(name => {
    logger[name].mock && logger[name].mockClear()
  })
}

function getTestImplementation(level) {
  return testLogImplementation

  function testLogImplementation(...args) {
    if (mock.logThings === 'all' || mock.logThings.indexOf(level) !== -1) {
      console.log(level, ...args) // eslint-disable-line no-console
    }
  }
}
