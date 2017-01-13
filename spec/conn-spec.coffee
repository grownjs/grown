STATUS_CODES = require('http').STATUS_CODES

$ = require('./_protocol')

describe '#conn', ->
  beforeEach $

  describe 'request', ->
    it 'should handle params', (done) ->
      $.server.ctx.mount (conn) ->
        conn.req.url = '/?x=y'
        conn.req.body = { a: 'b' }
        conn.req.params = { m: 'n' }

        expect(conn.params).toEqual { x: 'y', a: 'b', m: 'n' }
        done()

      $.server.fetch()

    it 'should handle headers', (done) ->
      $.server.ctx.mount (conn) ->
        conn.put_req_header 'x', 'y'
        expect(conn.get_req_header 'x').toEqual 'y'

        conn.delete_req_header 'content-length'
        expect(conn.req_headers).toEqual { host: ':80', x: 'y' }
        done()

      $.server.fetch()

  describe 'response', ->
    it 'should responds to unsupported requests with 501', (done) ->
      $.server.fetch (req, next) ->
        next (e, res) ->
          expect(e).toBeUndefined()
          expect(res.statusMessage).toEqual STATUS_CODES[501]
          expect(res.statusCode).toEqual 501
          done()

    it 'should handle headers', (done) ->
      $.server.ctx.mount (conn) ->
        conn.resp_headers = { foo: 'bar', baz: 'buzz' }

        conn.delete_resp_header 'foo'
        expect(conn.resp_headers).toEqual { baz: 'buzz' }

        conn.resp_headers = null
        conn.put_resp_header 'x', 'y'
        expect(conn.get_resp_header 'x').toEqual 'y'

        conn.merge_resp_headers { a: 'b' }
        expect(conn.resp_headers).toEqual { x: 'y', a: 'b' }
        done()

      $.server.fetch()

    it 'should handle content-type and charset', (done) ->
      $.server.ctx.mount (conn) ->
        conn.resp_charset = 'UTF-8'
        conn.put_resp_content_type 'text/plain'

      $.server.fetch().then (res) ->
        expect(res.getHeader('Content-Type')).toEqual 'text/plain; charset=UTF-8'
        done()

    it 'should finalize the response through `end()`', (done) ->
      $.server.ctx.mount (conn) ->
        conn.end 'OK'

      $.server.fetch().then (res) ->
        expect(res.statusCode).toEqual 200
        expect(res.getHeader('Content-Type')).toEqual 'text/html; charset=utf8'
        done()

  it 'should responds to redirections through `redirect()`', (done) ->
    $.server.ctx.mount (conn) ->
      conn.redirect('/y?a=b')

    $.server.fetch (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusCode).toEqual 302
        expect(res.statusMessage).toEqual STATUS_CODES[302]
        expect(res.getHeader('location')).toEqual '/y?a=b'
        done()

  it 'should responds to any statusCode through `put_status()`', (done) ->
    $.server.ctx.mount (conn) ->
      expect(-> conn.put_status()).toThrow()
      conn.put_status(404)

    $.server.fetch (req, next) ->
      next (e, res) ->
        expect(e).toBeUndefined()
        expect(res.statusMessage).toEqual STATUS_CODES[404]
        expect(res.statusCode).toEqual 404
        done()

  describe 'conn-like middleware support', ->
    it 'supports plain functions', (done) ->
      $.server.ctx.mount -> done()
      $.server.fetch()

    it 'supports promise values', (done) ->
      $.server.ctx.mount (conn) ->
        new Promise (resolve) ->
          setTimeout ->
            resolve()
            done()
          , 1

      $.server.fetch()

    it 'supports primitive classes', (done) ->
      class Dummy
        call: -> done()

      $.server.ctx.mount Dummy
      $.server.fetch()

    it 'supports plain-old callbacks', (done) ->
      dummy =
        call: -> done()

      $.server.ctx.mount dummy
      $.server.fetch()

    it 'supports iterator-like callbacks', (done) ->
      dummy =
        next: -> { done: true, value: done() }

      $.server.ctx.mount dummy
      $.server.fetch()

    it 'supports generator-like callbacks', (done) ->
      $.server.ctx.mount `(function*(){yield done})`
      $.server.fetch()

  describe 'error reporting', ->
    it 'should output readable markup', (done) ->
      $.server.ctx.mount (conn) ->
        conn.req.body = { x: 'y', m: ['n', 'o'] }

        err = new Error 'HTML'
        err.errors = [{ a: 'b' }]

        throw err

      $.server.fetch().then (res) ->
        expect(res.body).toContain '<h4>Error <code>⇐ ? ⇐ host</code></h4>'
        expect(res.body).toContain '<summary>HTML</summary>'
        expect(res.body).toContain '<h5>Stack:</h5>'
        expect(res.body).toContain './spec/conn-spec.coffee'
        expect(res.body).toContain '<dt>x</dt><dd>"y"</dd>'
        expect(res.body).toContain '<dt>m</dt><dd>["n","o"]</dd>'
        expect(res.body).toContain '<h5>Errors:</h5>'
        expect(res.body).toContain '''
          <pre>[
            {
              "a": "b"
            }
          ]</pre>
        '''
        done()

    it 'should output readable text', (done) ->
      $.server.ctx.mount (conn) ->
        conn.req.headers.accept = 'text/plain'
        conn.req.body = { x: 'y', m: ['n', 'o'] }

        err = new Error 'TEXT'
        err.errors = [{ a: 'b' }]

        throw err

      $.server.fetch().then (res) ->
        expect(res.body).toEqual '''
          Error <= ? <= host
          - TEXT
          - x  "y"
          - m  ["n","o"]
          [
            {
              "a": "b"
            }
          ]
        '''
        done()

    it 'should output useful json', (done) ->
      $.server.ctx.mount (conn) ->
        conn.req.headers.accept = 'application/json'
        conn.req.body = { x: 'y', m: ['n', 'o'] }

        err = new Error 'JSON'
        err.errors = [{ a: 'b' }]

        throw err

      $.server.fetch().then (res) ->
        err = JSON.parse(res.body)

        expect(err.status).toEqual 'error'
        expect(err.message.errors).toEqual [{ a: 'b' }]
        expect(err.message.stack).toContain './spec/conn-spec.coffee'
        expect(err.message.body).toEqual ['JSON']
        expect(err.message.name).toEqual 'Error'
        expect(err.message.code).toEqual 500
        expect(err.message.call).toEqual '<= ? <= host'

        done()
