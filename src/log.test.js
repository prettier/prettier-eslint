/* eslint no-console:0 */
import getLogger from './log'

jest.unmock('loglevel')

const logMap = {
  trace: 'trace',
  debug: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error',
}

Object.keys(logMap).forEach(logLevel => {
  console[logMap[logLevel]] = jest.fn()
})

const logger = getLogger('trace')

Object.keys(logMap).forEach(logLevel => {
  const logMethod = logMap[logLevel]
  const message = `Help me Obi Wan Kenobi. You're my only hope.`
  test(`${logLevel} logs to console.${logMethod}`, () => {
    logger[logLevel](message)
    expect(console[logMethod]).toHaveBeenCalledTimes(1)
    const prefix = expect.stringMatching(
      new RegExp(`prettier-eslint.*${logLevel.toUpperCase()}`),
    )
    expect(console[logMethod]).toHaveBeenCalledWith(prefix, message)
  })
})
