$ = require('./_protocol')

io = require('socket.io-client');

socket = require('../lib/plugs/socket')

describe '#socket', ->
  beforeEach $

  it 'should handle connections', (done) ->
    url = null

    $.server.use socket({
      server: true
      port: 8081
    })

    $.server.mount (conn) ->
      url = 'http:' + conn.socket_host + '/x'
      conn.channel('/x').then (socket) ->
        socket.emit 'y', 'z'
      true

    $.server.fetch().then ->
      client = io.connect url,
        transports: ['websocket']
        'force new connection': true

      client.on 'y', (data) ->
        expect(data).toBe 'z'
        $.close()
        done()
