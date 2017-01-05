STATUS_CODES = require('http').STATUS_CODES

$ = require('./_protocol')

describe '#conn', ->
  beforeEach $

  it 'has read-only properties', (done) ->
    $.server.ctx.mount (conn) ->
      expect(-> conn.req = null).toThrow()
      expect(conn.req).not.toBeNull()

      # common api
      expect(conn.env).toEqual 'test'
      expect(conn.host).toEqual ':80'
      expect(conn.port).toEqual 80
      expect(conn.method).toEqual 'GET'
      expect(conn.path_info).toEqual ['x']
      expect(conn.script_name).toEqual 'node_modules/.bin/jasmine-node'
      expect(conn.request_path).toEqual '/x'
      expect(conn.remote_ip).toEqual '0.0.0.0'
      expect(conn.req_headers).toEqual { host: ':80', 'content-length': 0 }
      expect(conn.type).toEqual ''
      expect(conn.scheme).toBeUndefined()
      expect(conn.path_params).toEqual {}
      expect(conn.body_params).toEqual {}
      expect(conn.query_params.y).toEqual 'z'
      expect(conn.query_string).toEqual 'y=z'
      expect(conn.params).toEqual { y: 'z' }
      expect(conn.resp_body).toEqual null
      expect(conn.resp_charset).toEqual 'utf8'
      expect(conn.resp_headers).toEqual {}
      # expect(conn.status).toEqual 501

      done()

    $.client.fetch('/x?y=z')

  it 'has read-only methods', (done) ->
    $.server.ctx.mount (conn) ->
      expect(typeof conn.resp).toEqual 'function'
      expect(typeof conn.get_req_header).toEqual 'function'
      expect(typeof conn.put_resp_header).toEqual 'function'
      expect(typeof conn.delete_resp_header).toEqual 'function'
      expect(typeof conn.redirect).toEqual 'function'
      expect(typeof conn.next).toEqual 'function'
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
    $.server.ctx.mount (conn) ->
      $.type = conn.type

    $.client (req, next) ->
      req.headers['content-type'] = 'application/json'

      next (e, res) ->
        expect(e).toBeUndefined()
        expect($.type).toEqual 'application/json'
        done()

  it 'should return the request query params through `conn.query_params`', (done) ->
    $.server.ctx.mount (conn) ->
      $.query = conn.query_params

    $.client (req, next) ->
      req.url = '/?foo=bar&baz=buzz'

      next (e, res) ->
        expect(e).toBeUndefined()
        expect($.query.foo).toEqual 'bar'
        expect($.query.baz).toEqual 'buzz'
        done()

  it 'should responds if `conn.resp_body` is not empty', (done) ->
    $.server.ctx.mount (conn) ->
      conn.resp_body = 'OSOM'

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusCode).toEqual 200
        expect(res.body).toEqual 'OSOM'
        done()

  it 'should responds to redirections through `redirect()`', (done) ->
    $.server.ctx.mount (conn) ->
      conn.redirect('/y?a=b')

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusCode).toEqual 302
        expect(res.statusMessage).toEqual STATUS_CODES[302]
        expect(res.getHeader('Location')).toEqual '/y?a=b'
        done()

  it 'should responds to any statusCode through `put_status()`', (done) ->
    $.server.ctx.mount (conn) ->
      expect(-> conn.put_status()).toThrow()
      conn.put_status(404)

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusMessage).toEqual STATUS_CODES[404]
        expect(res.statusCode).toEqual 404
        done()

  it 'should append headers to the response through `put_resp_header()`', (done) ->
    $.server.ctx.mount (conn) ->
      conn.merge_resp_headers { candy: 'does' }
      conn.put_resp_header 'foo', 'bar'

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.getHeader('Foo')).toEqual 'bar'
        expect(res.getHeader('Candy')).toEqual 'does'
        done()

  it 'should return headers from the request through `get_req_header()`', (done) ->
    $.server.ctx.mount (conn) ->
      $.host = conn.get_req_header('host')
      $.undef = conn.get_req_header('undef', 'def')

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect($.host).toEqual ':80'
        expect($.undef).toEqual 'def'
        done()

  it 'should delete headers from the response through `delete_resp_header()`', (done) ->
    $.server.ctx.mount (conn) ->
      conn.put_resp_header 'foo', 'bar'
      conn.put_resp_header 'baz', 'buzz'
      conn.delete_resp_header 'baz'

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.getHeader('Foo')).toEqual 'bar'
        expect(res.getHeader('Baz')).toBeUndefined()
        done()

  it 'should emit the response and its headers through `resp()`', (done) ->
    $.server.ctx.mount (conn) ->
      conn.resp 'SEND'

    $.client (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusMessage).toEqual 'Not Implemented'
        expect(res.statusCode).toEqual 501
        expect(res.body).toEqual 'SEND'
        done()

  describe 'conn-like middleware support', ->
    it 'supports plain functions', (done) ->
      $.server.ctx.mount -> done()
      $.client.fetch()

    it 'supports promise values', (done) ->
      $.server.ctx.mount (conn) ->
        new Promise (resolve) ->
          setTimeout ->
            resolve()
            done()
          , 1

      $.client.fetch()

    it 'supports primitive classes', (done) ->
      class Dummy
        call: -> done()

      $.server.ctx.mount Dummy
      $.client.fetch()

    it 'supports plain-old callbacks', (done) ->
      dummy =
        call: -> done()

      $.server.ctx.mount dummy
      $.client.fetch()

    it 'supports iterator-like callbacks', (done) ->
      dummy =
        next: -> { done: true, value: done() }

      $.server.ctx.mount dummy
      $.client.fetch()

    it 'supports generator-like callbacks', (done) ->
      $.server.ctx.mount `(function*(){yield done})`
      $.client.fetch()
