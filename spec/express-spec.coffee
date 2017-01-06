$ = require('./_protocol')

describe 'known express-middleware', ->
  beforeEach $

  it 'supports error-handling middleware', (done) ->
    $.server.ctx.mount (e, req, res, next) ->
      expect(e.message).toEqual 'D:'
      done()

    $.server.ctx.mount ->
      throw new Error 'D:'

    $.server.fetch()

  describe 'input support', ->
    it 'supports `method-override` for hacking `req.method`', (done) ->
      $.server.ctx.mount require('method-override')()

      $.server.fetch (req, next) ->
        req.method = 'POST'
        req.headers['x-http-method-override'] = 'patch'

        next (e, res) ->
          expect(e).toBeUndefined()
          expect(req.method).toEqual 'PATCH'
          expect(req.originalMethod).toEqual 'POST'
          done()

    it 'supports `body-parser` for JSON payloads', (done) ->
      $.server.ctx.mount require('body-parser').json()
      $.server.ctx.mount (conn) ->
        $.params = conn.params

      $.server.fetch (req, next) ->
        req._pushData('{"foo":"bar"}')
        req.headers['content-type'] = 'application/json'

        next (e, res) ->
          expect(e).toBeUndefined()
          expect(req.body).toEqual { foo: 'bar' }
          expect($.params).toEqual { foo: 'bar' }
          done()

    it 'supports `body-parser` for urlencoded payloads', (done) ->
      $.server.ctx.mount require('body-parser').urlencoded(extended: true)

      $.server.fetch (req, next) ->
        req._pushData('baz=buzz')
        req.headers['content-type'] = 'application/x-www-form-urlencoded'

        next (e, res) ->
          expect(e).toBeUndefined()
          expect(req.body).toEqual { baz: 'buzz' }
          done()

# TODO: using redis the process isn't closing
describe 'session support', ->
  beforeEach $
  beforeEach ->
    session = require('express-session')

    $.server.ctx.mount session({
      resave: false
      saveUninitialized: false
      key: 'key'
      secret: 's*cret'
    })

  it 'supports `express-session` for sessions', (done) ->
    $.server.ctx.mount (conn) ->
      conn.req.session.foo = 'bar'

    $.server.ctx.mount (conn) ->
      expect(conn.req.session.foo).toEqual 'bar'
      done()

    $.server.fetch()

  it 'supports `csurf` for CSRF-protection', (done) ->
    $.server.ctx.mount require('csurf')()

    $.server.ctx.mount (conn) ->
      expect(typeof conn.req.csrfToken).toBe 'function'
      expect(conn.req.session.csrfSecret).not.toBeUndefined()
      done()

    $.server.fetch()
