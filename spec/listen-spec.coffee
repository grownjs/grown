listenFactory = require('../lib/api/listen')
parseUrl = require('url').parse

describe '#listen', ->
  beforeEach ->
    @called = false
    @closed = false

    @close = =>
      @closed = true

    @container =
      _context:
        hosts: {}
        servers: {}
        protocols: {}
      options: {}
      pipeline: []
      extensions: {}
      initializers: []

    @container._context.protocols =
      http:
        createServer: =>
          listen: (port, host, callback) =>
            @called = true
            callback.call(@)

    listenFactory(@container)

  it 'should be called (quick-check)', (done) ->
    @container._context.listen('http://').then =>
      expect(@called).toBe true
      done()

  it 'supports many settings formats', (done) ->
    Promise.all([
      @container._context.listen().then (server) -> expect(server.port).toEqual 80
      @container._context.listen(8081).then (server) -> expect(server.port).toEqual 8081
      @container._context.listen('local.dev').then (server) -> expect(server.host).toEqual 'local.dev'
      @container._context.listen(parseUrl('http://local.dev:8081')).then (server) -> expect(server.port).toEqual 8081
    ]).then -> done()

  it 'should expose a close() function', (done) ->
    ctx = @container._context.listen((server) =>
      server.close()
      expect(@closed).toBe true
    ).then -> done()

  it 'should reuse already defined resources', ->
    @container._context.servers[5000] = true
    @container._context.listen(5000)
