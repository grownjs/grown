$ = require('./_protocol')

io = require('socket.io-client');

socket = require('../lib/plugs/socket')

describe '#socket', ->
  beforeEach $

  it '...', (done) ->
    options =
      transports: ['websocket']
      'force new connection': true

    url = null
    ok = null

    $.server.use socket(8081)

    $.server.mount (conn) ->
      url = 'http:' + conn.socket_host + '/x'
      conn.socket('/x').then ->
        ok = true
      true

    $.server.fetch().then ->
      client = io.connect(url, options)
      client.on 'connect', ->
        expect(ok).toBe true
        $.close()
        done()
