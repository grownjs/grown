$ = ->
  $.server = require('..')()
  $.client = require('../test')($.server)
  $.server.protocols.test = $.client.makeProtocol()

describe '#conn', ->
  beforeEach $

  it 'should responds to unsupported requests with 501', (done) ->
    $.client (req, next) ->
      next (res) ->
        expect(res.statusMessage).toEqual 'Not Implemented'
        expect(res.statusCode).toEqual 501
        done()

  it 'should return the request content-type through `conn.type`', (done) ->
    $.server.mount (conn) ->
      $.type = conn.type

    $.client (req, next) ->
      req.headers['content-type'] = 'application/json'

      next (res) ->
        expect($.type).toEqual 'application/json'
        done()

  it 'should return the request query params through `conn.query`', (done) ->
    $.server.mount (conn) ->
      $.query = conn.query

    $.client (req, next) ->
      req.url = '/?foo=bar&baz[]=buzz'

      next (res) ->
        expect($.query).toEqual { foo: 'bar', baz: ['buzz'] }
        done()

  it 'should parse `req.body` as `conn.input` (json)', (done) ->
    $.server.mount (conn) ->
      $.test = conn.input

    $.client (req, next) ->
      req.setData('{"foo":"bar"}')
      req.headers['content-type'] = 'application/json'

      next (res) ->
        expect($.test).toEqual { foo: 'bar' }
        done()

  it 'should parse `req.body` as `conn.input` (form-data)', (done) ->
    $.server.mount (conn) ->
      $.test = conn.input

    $.client (req, next) ->
      req.setData('baz=buzz')
      req.headers['content-type'] = 'application/x-www-form-urlencoded'

      next (res) ->
        expect($.test).toEqual { baz: 'buzz' }
        done()

  it 'should responds if `conn.body` is not null', (done) ->
    $.server.mount (conn) ->
      conn.body = 'OSOM'

    $.client (req, next) ->
      next (res) ->
        expect(res.statusCode).toEqual 200
        expect(res.getBody()).toEqual 'OSOM'
        done()

  it 'should override `req.method` through _method', (done) ->
    $.client (req, next) ->
      req.method = 'POST'
      req.headers._method = 'patch'

      next (res) ->
        expect(req.method).toEqual 'PATCH'
        expect(req.originalMethod).toEqual 'POST'
        done()

  it 'should responds to redirections through `redirect()`', (done) ->
    $.server.mount (conn) ->
      conn.redirect('/y')

    $.client (req, next) ->
      next (res) ->
        expect(res.getHeader('Location')).toEqual '/y'
        expect(res.statusMessage).toEqual 'Found'
        expect(res.statusCode).toEqual 302
        done()

  it 'should responds to any statusCode through `status()`', (done) ->
    $.server.mount (conn) ->
      conn.status(404)

    $.client (req, next) ->
      next (res) ->
        expect(res.statusMessage).toEqual 'Not Found'
        expect(res.statusCode).toEqual 404
        done()

  it 'should append headers to the response through `set()`', (done) ->
    $.server.mount (conn) ->
      conn.set 'foo', 'bar'
      conn.end()

    $.client (req, next) ->
      next (res) ->
        expect(res.getHeader('Foo')).toEqual 'bar'
        done()

  it 'should return headers from the request through `get()`', (done) ->
    $.server.mount (conn) ->
      $.host = conn.get('host')

    $.client (req, next) ->
      next (res) ->
        expect($.host).toEqual ':80'
        done()

  it 'should delete headers from the response through `unset()`', (done) ->
    $.server.mount (conn) ->
      conn.set 'foo', 'bar'
      conn.set 'baz', 'buzz'
      conn.unset 'baz'
      conn.end()

    $.client (req, next) ->
      next (res) ->
        expect(res.getHeader('Foo')).toEqual 'bar'
        expect(res.getHeader('Baz')).toBeUndefined()
        done()

  it 'should emit the response and its headers through `send()`', (done) ->
    $.server.mount (conn) ->
      conn.send 'SEND'

    $.client (req, next) ->
      next (res) ->
        expect(res.getBody()).toEqual 'SEND'
        done()

  it 'should set the `conn.body` and/or statusCode through `end()`', (done) ->
    $.server.mount (conn) ->
      conn.end 201, 'END'
      conn.end 'DONE'

    $.client (req, next) ->
      next (res) ->
        expect(res.statusMessage).toEqual 'END'
        expect(res.statusCode).toEqual 201
        expect(res.getBody()).toEqual 'DONE'
        done()
