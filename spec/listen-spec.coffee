listenFactory = require('../lib/api/listen')
parseUrl = require('url').parse

describe '#listen', ->
  beforeEach ->
    @called = false
    @closed = false

    @close = =>
      @closed = true

    @ctx =
      _hosts: {}
      _servers: {}
      _protocols: {}

    @ctx._protocols =
      http:
        createServer: =>
          listen: (port, host, callback) =>
            @called = true
            callback.call(@)

    @ctx.listen = listenFactory.bind(@ctx)

  it 'should be called (quick-check)', (done) ->
    @ctx.listen 'http://', =>
      expect(@called).toBe true
      done()

  it 'supports many settings formats', (done) ->
    Promise.all([
      @ctx.listen().then (server) -> expect(server.port).toEqual 80
      @ctx.listen(8081).then (server) -> expect(server.port).toEqual 8081
      @ctx.listen('local.dev').then (server) -> expect(server.host).toEqual 'local.dev'
      @ctx.listen(parseUrl('http://local.dev:8081')).then (server) -> expect(server.port).toEqual 8081
    ]).then -> done()

  it 'should expose a close() function', (done) ->
    ctx = @ctx.listen((server) =>
      server.close()
      expect(@closed).toBe true
    ).then -> done()

  it 'should reuse already defined resources', ->
    @ctx._servers[5000] = true
    @ctx.listen(5000)
    expect(@ctx._servers[5000]).toBe true
