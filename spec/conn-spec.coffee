STATUS_CODES = require('http').STATUS_CODES

$ = require('./_protocol')

describe '#conn', ->
  beforeEach $

  it 'has read-only properties', ->
    $.server.mount (conn) ->
      expect(-> conn.app = null).toThrow()
      done()

    $.client.fetch()

  it 'should responds to unsupported requests with 501', (done) ->
    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusMessage).toEqual STATUS_CODES[501]
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
      conn.redirect('/y?a=b')

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.getHeader('Location')).toEqual '/y?a=b'
        expect(res.statusMessage).toEqual STATUS_CODES[302]
        expect(res.statusCode).toEqual 302
        done()

  it 'should responds to any statusCode through `status()`', (done) ->
    $.server.mount (conn) ->
      expect(-> conn.status()).toThrow()
      conn.status(404)

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusMessage).toEqual STATUS_CODES[404]
        expect(res.statusCode).toEqual 404
        done()

  it 'should append headers to the response through `set()`', (done) ->
    $.server.mount (conn) ->
      conn.set { candy: 'does' }
      conn.set 'candy', 'nothing', true
      conn.set 'foo', 'bar'
      conn.end()

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.getHeader('Foo')).toEqual 'bar'
        expect(res.getHeader('Candy')).toEqual ['does', 'nothing']
        done()

  it 'should return headers from the request through `get()`', (done) ->
    $.server.mount (conn) ->
      $.host = conn.get('host')
      $.undef = conn.get('undef', 'def')

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect($.host).toEqual ':80'
        expect($.undef).toEqual 'def'
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

  it 'should set the `conn.body` through `end()`', (done) ->
    $.server.mount (conn) ->
      conn.end 'DONE'

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusMessage).toEqual 'OK'
        expect(res.statusCode).toEqual 200
        expect(res._getBody()).toEqual 'DONE'
        done()

  it 'should validate `conn.input` properly', (done) ->
    $.server.mount (conn) ->
      expect(-> conn.input).toThrow()
      done()
    $.client.fetch()

  it 'should validate `conn.send` properly', (done) ->
    $.server.mount (conn) ->
      conn.res.finished = true
      expect(-> conn.send()).toThrow()
      done()
    $.client.fetch()

  describe 'conn-like middleware support', ->
    it 'supports plain functions', (done) ->
      $.server.mount -> done()
      $.client.fetch()

    it 'supports promise values', (done) ->
      $.server.mount (conn) ->
        new Promise (resolve) ->
          setTimeout ->
            resolve()
            done()
          , 1

      $.client.fetch()

    it 'supports primitive classes', (done) ->
      class Dummy
        call: -> done()

      $.server.mount Dummy
      $.client.fetch()

    it 'supports plain-old callbacks', (done) ->
      dummy =
        call: -> done()

      $.server.mount dummy
      $.client.fetch()

    it 'supports iterator-like callbacks', (done) ->
      dummy =
        next: -> { done: true, value: done() }

      $.server.mount dummy
      $.client.fetch()

    it 'supports generator-like callbacks', (done) ->
      e = null

      try
        _generator = eval('(function*(){yield done})')

        $.server.mount _generator
        $.client.fetch()
      catch _e
        e = _e
        done()

      if parseFloat(process.version.substr(1)) >= 4.0
        expect(e).toBe null
