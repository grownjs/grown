$ = require('./_protocol')

session = require('../lib/plugs/session')

describe '#session', ->
  beforeEach $

  it 'should support cookie/session', (done) ->
    $.server.use session({ secret: 'test' })

    $.server.on 'listen', ->
      $.server.mount (conn) ->
        conn.put_session 'x', 'y'

      $.server.mount (conn) ->
        conn.put_resp_cookie 'x', 'y', { a: 'b' }
        conn.resp_body = conn.session.x

        $.cookies = conn.cookies

    $.server.fetch({ headers: { cookie: 'foo=bar' } }).then (res) ->
      expect(res.cookies).toEqual { x: { value: 'y', opts: { a: 'b' } } }
      expect($.cookies).toEqual { foo: 'bar' }
      expect(res.body).toEqual 'y'
      done()

  it 'should support csurf for safety', (done) ->
    $.server.use session({ secret: 'test' })

    $.server.on 'listen', ->
      # FIXME: not working without cookies...
      $.server.mount require('csurf')({ cookie: true })

      $.server.mount (conn) ->
        conn.end('OSOM') if conn.request_path is '/check'
        conn.end(conn.csrf_token) if conn.request_path is '/csrf'

    $.server.fetch('/csrf').then (res) ->
      $.server.fetch('/check', 'post', {
        body: { _csrf: res.body }
        cookies: res.cookies
      })
      .then (res) ->
        expect(res.body).toEqual 'OSOM'
        done()
