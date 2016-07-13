describe '#server', ->
  it 'should fail on unsupported protocols', ->
    server = require('..')()

    server.protocols.http =
    server.protocols.https =
      createServer: ->

    expect(-> server.listen 'http://').toThrow()
    expect(-> server.listen 'https://').toThrow()
