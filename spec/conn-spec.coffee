server = require('..')()
client = require('../test')(server)
server.protocols.test = client.makeProtocol()

describe '#conn', ->
  it 'should responds to unsupported requests with 501', (done) ->
    client (req, next) ->
      req.url = '/'

      next (res) ->
        expect(res.statusMessage).toEqual 'Not Implemented'
        expect(res.statusCode).toEqual 501
        done()

  it 'should responds to supported requests properly', (done) ->
    server.mount (conn) ->
      conn.body = 'OSOM' if conn.req.url is '/x'

    client (req, next) ->
      req.url = '/x'

      next (res) ->
        expect(res.statusCode).toEqual 200
        expect(res._body).toEqual 'OSOM'
        done()

# TODO: conn: _method, redirect, status, unset, set, get, send, end
