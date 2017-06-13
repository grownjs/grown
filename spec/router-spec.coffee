{ resolve } = require('path')

$ = require('./_protocol')

router = require('../lib/plugs/router')

useConfig = (name, middlewares) ->
  $.server.use router({
    middlewares: if middlewares then {
      settings: resolve(__dirname, '_fixtures', name, 'config/middlewares.js')
      folders: resolve(__dirname, '_fixtures', name, 'boot/middlewares')
    } else null
    settings: resolve(__dirname, '_fixtures', name, 'config/routes.js')
    folders: resolve(__dirname, '_fixtures', name, 'app/controllers')
  })

describe '#router', ->
  beforeEach $

  it 'should responds to unsupported requests with 405', (done) ->
    useConfig 'no-routes'

    $.server.fetch().then (res) ->
      expect(res.statusMessage).toEqual 'Method Not Allowed'
      expect(res.statusCode).toEqual 405
      done()

  it 'should responds to unhandled routes with 501', (done) ->
    expect(-> useConfig 'one-route').toThrow()

    $.server.fetch().then (res) ->
      expect(res.statusCode).toEqual 501
      expect(res.statusMessage).toEqual 'Not Implemented'
      done()

  it 'should responds to undefined handlers with 500', (done) ->
    useConfig 'valid-routes'

    $.server.fetch('/no').then (res) ->
      expect(res.statusCode).toEqual 500
      expect(res.body).toMatch /Undefined .+? action/
      done()

  it 'should responds to defined handlers with 200', (done) ->
    useConfig 'valid-routes'

    $.server.fetch('/yes').then (res) ->
      expect(res.body).toEqual 'OSOM'
      expect(res.statusMessage).toEqual 'OK'
      expect(res.statusCode).toEqual 200
      done()

  it 'should responds to unmatched routes with 404', (done) ->
    useConfig 'valid-routes'

    $.server.fetch('/not/found').then (res) ->
      expect(res.statusMessage).toEqual 'Not Found'
      expect(res.statusCode).toEqual 404
      done()

  it 'should append `conn.params` and `conn.handler` when a route matches', (done) ->
    useConfig 'valid-routes'

    $.server.mount (@conn) =>
    $.server.fetch('/x').then =>
      expect(@conn.params).toEqual { value: 'x' }
      expect(@conn.handler.controller).toEqual 'Example'
      expect(@conn.handler.action).toEqual 'test_params'
      done()

  it 'should fail when requiring any broken source', (done) ->
    useConfig 'valid-routes'

    $.server.fetch('/broken/handler').then (res) ->
      expect(res.body).toContain 'Unexpected token'
      expect(res.statusCode).toEqual 500
      done()

  it 'should fail on unknown route-middlewares', (done) ->
    useConfig 'with-middlewares', true

    $.server.fetch('/err').then (res) ->
      expect(res.body).toMatch /Undefined .+? middleware/
      expect(res.statusCode).toEqual 500
      done()

  it 'should fail on invalid route-middlewares', (done) ->
    useConfig 'with-middlewares', true

    $.server.fetch('/no').then (res) ->
      expect(res.body).toMatch /Middleware .+? should be callable/
      expect(res.statusCode).toEqual 500
      done()

  it 'should run route-middlewares properly', (done) ->
    useConfig 'with-middlewares', true

    $.server.fetch('/yes').then (res) ->
      expect(res.body).toEqual 'OSOM!'
      done()

  it 'should fail on invalid pipeline-handlers', (done) ->
    useConfig 'with-middlewares', true

    $.server.fetch('/maybe').then (res) ->
      expect(res.body).toMatch /Undefined .+? handler/
      expect(res.statusCode).toEqual 500
      done()

  it 'should run pipeline-handlers properly', (done) ->
    useConfig 'with-middlewares', true

    $.server.fetch('/surely').then (res) ->
      expect(res.body).toEqual 'OSOM!'
      done()

  it 'should inject values and methods', (done) ->
    useConfig 'with-middlewares', true

    $.server.fetch('/other-example').then (res) ->
      expect(res.body).toEqual '["SYNC","ASYNC"]'
      done()

  it 'should render() as fallback', (done) ->
    useConfig 'valid-routes', true

    test = null

    $.server.extensions('Conn', {
      methods:
        view: (msg) ->
          test = msg
    })

    $.server.fetch('/').then (res) ->
      expect(test).toEqual { src: 'Clean/empty', as: 'yield' }
      done()
