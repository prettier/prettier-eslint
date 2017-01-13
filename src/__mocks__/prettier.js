const prettier = require.requireActual('prettier')
const {format} = prettier

module.exports = prettier

const mockFormatSpy = jest.fn(mockFormat)

Object.assign(prettier, {
  format: mockFormatSpy,
})

function mockFormat(...args) {
  if (mockFormatSpy.throwError) {
    throw mockFormatSpy.throwError
  }
  return format(...args)
}
