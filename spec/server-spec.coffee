describe '#server', ->
  it 'should fail on unsupported protocols', (done) ->
    $ = require('..').new()

    $.protocols.http =
    $.protocols.https =
      createServer: ->

    error = 0

    Promise.all([
      $.ctx.listen('http://').catch(-> error++)
      $.ctx.listen('https://').catch(-> error++)
    ]).then ->
      expect(error).toEqual 2
      done()
