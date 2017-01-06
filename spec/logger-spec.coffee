$ = require('./_protocol')

stdMocks = require('std-mocks')
Homegrown = require('../lib')

describe '#logger', ->
  beforeEach ->
    $()
    $.server.ctx.use Homegrown.plugs.logger transports: ['Console']
    $.server.ctx.mount (conn) ->
      stdMocks.use()
      conn.log 'info', 'OK'
      conn.error ':('
      stdMocks.restore()

  it '...', (done) ->
    $.server.fetch().then (res) ->
      result = stdMocks.flush()
      expect(res.error).toBeUndefined()
      expect(result.stdout).toEqual ['info: OK\n']
      expect(result.stderr).toEqual ['error: :(\n']
      done()
