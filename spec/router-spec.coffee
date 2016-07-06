path = require('path')
server = require('..')()
client = require('../test')(server)
server.protocols.test = client.makeProtocol()

describe '#router', ->
  it 'should responds to unsupported requests with 405', (done) ->
    server.use require('../router')(path.resolve(__dirname, '../example'))

    client (req, next) ->
      req.url = '/'

      next (res) ->
        expect(res.statusMessage).toEqual 'Method Not Allowed'
        expect(res.statusCode).toEqual 405
        done()
