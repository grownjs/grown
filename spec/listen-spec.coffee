listenFactory = require('../lib/api').bind.listen
parseUrl = require('url').parse

describe '#listen', ->
  beforeEach ->
    @called = false
    @closed = false

    @close = =>
      @closed = true

    @container =
      ctx: {}
      opts: {}
      hosts: {}
      servers: {}
      protocols: {}
      options: {}
      pipeline: []
      extensions: {}
      initializers: []

    @container.protocols =
      http:
        createServer: =>
          listen: (port, host, callback) =>
            @called = true
            callback.call(@)

    listenFactory(@container)

  it 'should be called (quick-check)', (done) ->
    @container.ctx.listen('http://').then =>
      expect(@called).toBe true
      done()

  it 'supports many settings formats', (done) ->
    Promise.all([
      @container.ctx.listen().then (server) -> expect(server.port).toEqual 80
      @container.ctx.listen(8081).then (server) -> expect(server.port).toEqual 8081
      @container.ctx.listen('local.dev').then (server) -> expect(server.host).toEqual 'local.dev'
      @container.ctx.listen(parseUrl('http://local.dev:8081')).then (server) -> expect(server.port).toEqual 8081
    ]).then -> done()

  it 'should expose a close() function', (done) ->
    ctx = @container.ctx.listen((server) =>
      server.close()
      expect(@closed).toBe true
    ).then -> done()

  it 'should reuse already defined resources', ->
    @container.servers[5000] = true
    @container.ctx.listen(5000)
    expect(@container.servers[5000]).toBe true
