$ = require('./_protocol')

stdMocks = require('std-mocks')
Homegrown = require('../lib')

describe '#logger', ->
  beforeEach ->
    $()
    $.server.use Homegrown.plugs.logger transports: ['Console']
    $.server.mount (conn) ->
      stdMocks.use()
      conn.log 'info', 'OK'
      conn.error ':('
      stdMocks.restore()

  it 'should wrap log methods', (done) ->
    $.server.fetch().then (res) ->
      result = stdMocks.flush()
      expect(res.error).toBeUndefined()
      expect(result.stdout).toEqual ['info: OK\n']
      expect(result.stderr).toEqual ['error: :(\n']
      done()
