module.exports = getLogger;

const logger = {
  setLevel: jest.fn(),
  trace: jest.fn(getTestImplementation('trace')),
  debug: jest.fn(getTestImplementation('debug')),
  info: jest.fn(getTestImplementation('info')),
  warn: jest.fn(getTestImplementation('warn')),
  error: jest.fn(getTestImplementation('error')),
};

const mock = { clearAll, logger, logThings: [] };

Object.assign(module.exports, { mock });

function getLogger() {
  return logger;
}

function clearAll() {
  for (const name of Object.keys(logger)) {
    if (logger[name].mock) {
      logger[name].mockClear();
    }
  }
}

function getTestImplementation(level) {
  return testLogImplementation;

  function testLogImplementation(...args) {
    if (mock.logThings === 'all' || mock.logThings.includes(level)) {
      console.log(level, ...args); // eslint-disable-line no-console
    }
  }
}
