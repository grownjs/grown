path = require('path')
server = require('..')()
client = require('../test')(server)
server.protocols.test = client.protocol()

describe '#router', ->
  it 'should responds to unsupported requests with 405', (done) ->
    server.use require('../router')(path.resolve(__dirname, '../example'))

    client (req, next) ->
      next (e, res) ->
        expect(res.statusMessage).toEqual 'Method Not Allowed'
        expect(res.statusCode).toEqual 405
        done()
