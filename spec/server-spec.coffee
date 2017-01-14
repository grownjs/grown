describe '#server', ->
  it 'should fail on unsupported protocols', (done) ->
    $ = require('..').new()

    $._protocols.http =
    $._protocols.https =
      createServer: ->

    error = 0

    Promise.all([
      $.listen('http://').catch(-> error++)
      $.listen('https://').catch(-> error++)
    ]).then ->
      expect(error).toEqual 2
      done()
