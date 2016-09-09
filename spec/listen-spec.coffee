listenFactory = require('../lib/api/listen')
parseUrl = require('url').parse

describe '#listen', ->
  beforeEach ->
    @called = false
    @closed = false

    @close = =>
      @closed = true

    @context =
      hosts: {}
      servers: {}
      protocols: {}

    @container =
      options: {}
      pipeline: []
      extensions: {}

    @context.protocols =
      http:
        createServer: =>
          listen: (port, host, callback) =>
            @called = true
            callback.call(@)

    listenFactory(@context, @container)

  it 'should be called (quick-check)', ->
    @context.listen 'http://'
    expect(@called).toBe true

  it 'supports many settings formats', ->
    expect(@context.listen().port).toEqual 80
    expect(@context.listen(8081).port).toEqual 8081
    expect(@context.listen('local.dev').host).toEqual 'local.dev'
    expect(@context.listen(parseUrl('http://local.dev:8081')).port).toEqual 8081

  it 'should expose a close() function', (done) ->
    ctx = @context.listen =>
      ctx.close()
      expect(@closed).toBe true
      done()

  it 'should reuse already defined resources', ->
    @context.servers[5000] = true
    @context.listen(5000)
