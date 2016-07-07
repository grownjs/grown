$ = ->
  $.server = require('..')()
  $.client = require('../test')($.server)
  $.server.protocols.test = $.client.makeProtocol()

describe '#conn', ->
  beforeEach $

  it 'should responds to unsupported requests with 501', (done) ->
    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusMessage).toEqual 'Not Implemented'
        expect(res.statusCode).toEqual 501
        done()

  it 'should return the request content-type through `conn.type`', (done) ->
    $.server.mount (conn) ->
      $.type = conn.type

    $.client (req, next) ->
      req.headers['content-type'] = 'application/json'

      next (e, res) ->
        expect(e).toBeUndefined()
        expect($.type).toEqual 'application/json'
        done()

  it 'should return the request query params through `conn.query`', (done) ->
    $.server.mount (conn) ->
      $.query = conn.query

    $.client (req, next) ->
      req.url = '/?foo=bar&baz[]=buzz'

      next (e, res) ->
        expect(e).toBeUndefined()
        expect($.query).toEqual { foo: 'bar', baz: ['buzz'] }
        done()

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

  it 'should responds if `conn.body` is not null', (done) ->
    $.server.mount (conn) ->
      conn.body = 'OSOM'

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusCode).toEqual 200
        expect(res._getBody()).toEqual 'OSOM'
        done()

  it 'should responds to redirections through `redirect()`', (done) ->
    $.server.mount (conn) ->
      conn.redirect('/y')

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.getHeader('Location')).toEqual '/y'
        expect(res.statusMessage).toEqual 'Found'
        expect(res.statusCode).toEqual 302
        done()

  it 'should responds to any statusCode through `status()`', (done) ->
    $.server.mount (conn) ->
      conn.status(404)

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusMessage).toEqual 'Not Found'
        expect(res.statusCode).toEqual 404
        done()

  it 'should append headers to the response through `set()`', (done) ->
    $.server.mount (conn) ->
      conn.set 'foo', 'bar'
      conn.end()

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.getHeader('Foo')).toEqual 'bar'
        done()

  it 'should return headers from the request through `get()`', (done) ->
    $.server.mount (conn) ->
      $.host = conn.get('host')

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect($.host).toEqual ':80'
        done()

  it 'should delete headers from the response through `unset()`', (done) ->
    $.server.mount (conn) ->
      conn.set 'foo', 'bar'
      conn.set 'baz', 'buzz'
      conn.unset 'baz'
      conn.end()

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.getHeader('Foo')).toEqual 'bar'
        expect(res.getHeader('Baz')).toBeUndefined()
        done()

  it 'should emit the response and its headers through `send()`', (done) ->
    $.server.mount (conn) ->
      conn.send 'SEND'

    $.client (req, next) ->
      next (e, res) ->
        expect(e.message).toEqual 'Not Implemented'
        expect(res._getBody()).toEqual 'SEND'
        done()

  it 'should set the `conn.body` and/or statusCode through `end()`', (done) ->
    $.server.mount (conn) ->
      conn.end 201, 'END'
      conn.end 'DONE'

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusMessage).toEqual 'END'
        expect(res.statusCode).toEqual 201
        expect(res._getBody()).toEqual 'DONE'
        done()
