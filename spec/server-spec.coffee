describe '#server', ->
  it 'should fail on unsupported protocols', (done) ->
    server = require('..').new()

    server.protocols.http =
    server.protocols.https =
      createServer: ->

    error = 0

    Promise.all([
      server.listen('http://').catch(-> error++)
      server.listen('https://').catch(-> error++)
    ]).then ->
      expect(error).toEqual 2
      done()
