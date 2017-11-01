$ = require('./_protocol')

fs = require('fs')

describe 'known express-middleware', ->
  beforeEach $

  it 'supports error-handling middleware', (done) ->
    $.server.mount (e, req, res, next) ->
      expect(e.message).toEqual 'D:'
      done()

    $.server.mount ->
      throw new Error 'D:'

    $.server.fetch()

  it 'supports mount-paths constraints', (done) ->
    test = null

    $.server.mount '/test', (req, res, next) ->
      test = 42
      next()

    $.server.mount ->
      done()

    $.server.fetch('/test').then ->
      expect(test).toEqual 42

  describe 'input support', ->
    it 'supports `method-override` for hacking `req.method`', (done) ->
      $.server.mount require('method-override')()
      $.server.mount (conn) ->
        expect(conn.req.method).toEqual 'PATCH'
        expect(conn.req.originalMethod).toEqual 'POST'

      $.server.fetch({ method: 'POST', headers: { 'x-http-method-override': 'patch' } }).then done

    it 'supports `body-parser` for JSON payloads', (done) ->
      $.server.mount require('body-parser').json()
      $.server.mount (conn) ->
        $.params = conn.params

      $.server.fetch (req) ->
        req.write('{"foo":"bar"}')
        req.end()
        req
      , 'PUT'
      , { headers: { 'content-length': 13, 'content-type': 'application/json' } }
      .then ->
        expect($.params).toEqual { foo: 'bar' }
        done()

    it 'supports `body-parser` for urlencoded payloads', (done) ->
      $.server.mount require('body-parser').urlencoded(extended: true)
      $.server.mount (conn) ->
        $.params = conn.params

      $.server.fetch (req) ->
        req.write 'baz=buzz'
        req.end()
        req
      , 'PUT'
      , { headers: { 'content-length': 8, 'content-type': 'application/x-www-form-urlencoded' } }
      .then ->
        expect($.params).toEqual { baz: 'buzz' }
        done()

    it 'support `serve-static` for serving files', (done) ->
      $.server.mount require('serve-static')(__dirname)

      $.server.fetch('/express-spec.coffee')

      .then (res) ->
        expect(res.body).toEqual fs.readFileSync(__filename).toString()
        done()
