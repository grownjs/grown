listenFactory = require('../lib/api/listen')
parseUrl = require('url').parse

describe '#listen', ->
  beforeEach ->
    @called = false
    @closed = false

    @close = =>
      @closed = true

    @container =
      context:
        hosts: {}
        servers: {}
        protocols: {}
      options: {}
      pipeline: []
      extensions: {}

    @container.context.protocols =
      http:
        createServer: =>
          listen: (port, host, callback) =>
            @called = true
            callback.call(@)

    listenFactory(@container)

  it 'should be called (quick-check)', ->
    @container.context.listen 'http://'
    expect(@called).toBe true

  it 'supports many settings formats', ->
    expect(@container.context.listen().port).toEqual 80
    expect(@container.context.listen(8081).port).toEqual 8081
    expect(@container.context.listen('local.dev').host).toEqual 'local.dev'
    expect(@container.context.listen(parseUrl('http://local.dev:8081')).port).toEqual 8081

  it 'should expose a close() function', (done) ->
    ctx = @container.context.listen =>
      ctx.close()
      expect(@closed).toBe true
      done()

  it 'should reuse already defined resources', ->
    @container.context.servers[5000] = true
    @container.context.listen(5000)
