$ = require('./_protocol')

describe 'known express-middleware', ->
  beforeEach $

  it 'supports error-handling middleware', (done) ->
    $.server.mount (e, req, res, next) ->
      expect(e.message).toEqual 'D:'
      done()

    $.server.mount ->
      throw new Error 'D:'

    $.client.fetch()

  it 'supports method-override for hacking `req.method`', (done) ->
    $.server.mount require('method-override')()

    $.client (req, next) ->
      req.method = 'POST'
      req.headers['x-http-method-override'] = 'patch'

      next (e, res) ->
        expect(e).toBeUndefined()
        expect(req.method).toEqual 'PATCH'
        expect(req.originalMethod).toEqual 'POST'
        done()

  it 'supports body-parser for JSON payloads', (done) ->
    $.server.mount require('body-parser').json()
    $.server.mount (conn) ->
      $.input = conn.input

    $.client (req, next) ->
      req._pushData('{"foo":"bar"}')
      req.headers['content-type'] = 'application/json'

      next (e, res) ->
        expect(e).toBeUndefined()
        expect(req.body).toEqual { foo: 'bar' }
        expect($.input).toEqual { foo: 'bar' }
        done()

  it 'supports body-parser for urlencoded payloads', (done) ->
    $.server.mount require('body-parser').urlencoded(extended: true)

    $.client (req, next) ->
      req._pushData('baz=buzz')
      req.headers['content-type'] = 'application/x-www-form-urlencoded'

      next (e, res) ->
        expect(e).toBeUndefined()
        expect(req.body).toEqual { baz: 'buzz' }
        done()
