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

    @container._context.protocols =
      http:
        createServer: =>
          listen: (port, host, callback) =>
            @called = true
            callback.call(@)

    listenFactory(@container)

  it 'should be called (quick-check)', ->
    @container._context.listen 'http://'
    expect(@called).toBe true

  it 'supports many settings formats', ->
    expect(@container._context.listen().port).toEqual 80
    expect(@container._context.listen(8081).port).toEqual 8081
    expect(@container._context.listen('local.dev').host).toEqual 'local.dev'
    expect(@container._context.listen(parseUrl('http://local.dev:8081')).port).toEqual 8081

  it 'should expose a close() function', (done) ->
    ctx = @container._context.listen =>
      ctx.close()
      expect(@closed).toBe true
      done()

  it 'should reuse already defined resources', ->
    @container._context.servers[5000] = true
    @container._context.listen(5000)
