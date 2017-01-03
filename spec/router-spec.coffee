{ resolve } = require('path')

$ = require('./_protocol')

useConfig = (name) ->
  $.server.ctx.use require('../router')(resolve(__dirname, '_fixtures', name))

describe '#router', ->
  beforeEach $

  it 'should fail on undefined `cwd` option', ->
    expect(-> $.server.use require('../router')()).toThrow()

  it 'should responds to unsupported requests with 405', (done) ->
    useConfig 'no-routes'

    $.client.fetch().then (res) ->
      expect(res.statusMessage).toEqual 'Method Not Allowed'
      expect(res.statusCode).toEqual 405
      done()

  it 'should responds to unhandled routes with 501', (done) ->
    expect(-> useConfig 'one-route').toThrow()

    $.client.fetch().then (res) ->
      expect(res.statusCode).toEqual 501
      expect(res.statusMessage).toEqual 'Not Implemented'
      done()

  it 'should responds to undefined handlers with 501', (done) ->
    useConfig 'valid-routes'

    $.client.fetch('/no').then (res) ->
      expect(res.statusCode).toEqual 501
      expect(res.body).toMatch /Undefined .+? handler/
      expect(res.body).toContain res.error.message
      done()

  it 'should responds to defined handlers with 200', (done) ->
    useConfig 'valid-routes'

    $.client.fetch('/yes').then (res) ->
      expect(res.body).toEqual 'OSOM'
      expect(res.statusMessage).toEqual 'OK'
      expect(res.statusCode).toEqual 200
      done()

  it 'should responds to unmatched routes with 404', (done) ->
    useConfig 'valid-routes'

    $.client.fetch('/not/found').then (res) ->
      expect(res.statusMessage).toEqual 'Not Found'
      expect(res.statusCode).toEqual 404
      done()

  it 'should append `conn.params` and `conn.handler` when a route matches', (done) ->
    $.server.ctx.mount (conn) ->
      conn.next ->
        $.params = conn.params
        $.handler = conn.handler

    useConfig 'valid-routes'

    $.client.fetch('/x').then ->
      expect($.params).toEqual { value: 'x' }
      expect($.handler.controller).toEqual 'Example'
      expect($.handler.action).toEqual 'test_params'
      done()

  it 'should fail when requiring any broken source', (done) ->
    useConfig 'valid-routes'

    $.client.fetch('/broken/handler').then (res) ->
      expect(res.body).toContain 'Unexpected token'
      expect(res.statusCode).toEqual 501
      done()

  it 'should fail on invalid route-middlewares', (done) ->
    useConfig 'with-middlewares'

    $.client.fetch('/no').then (res) ->
      expect(res.body).toMatch /Middleware .+? should be callable/
      expect(res.statusCode).toEqual 501
      done()

  it 'should fail on unknown route-middlewares', (done) ->
    useConfig 'with-middlewares'

    $.client.fetch('/err').then (res) ->
      expect(res.body).toMatch /Undefined .+? middleware/
      expect(res.statusCode).toEqual 501
      done()

  it 'should run route-middlewares properly', (done) ->
    useConfig 'with-middlewares'

    $.client.fetch('/yes').then (res) ->
      expect(res.body).toEqual 'OSOM!'
      done()

  it 'should fail on invalid pipeline-handlers', (done) ->
    useConfig 'with-middlewares'

    $.client.fetch('/maybe').then (res) ->
      expect(res.body).toMatch /Undefined .+? handler/
      expect(res.statusCode).toEqual 501
      done()

  it 'should run pipeline-handlers properly', (done) ->
    useConfig 'with-middlewares'

    $.client.fetch('/surely').then (res) ->
      expect(res.body).toEqual 'OSOM!'
      done()
