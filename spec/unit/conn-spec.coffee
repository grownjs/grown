server = require('../..')()
client = require('../../test')(server)
server.protocols.test = client.makeProtocol()

describe 'conn', ->
  it 'should responds any request with 501', (done) ->
    client (req, next) ->
      req.url = '/'

      next (res) ->
        expect(res.statusMessage).toEqual 'Not Implemented'
        expect(res.statusCode).toEqual 501
        done()
