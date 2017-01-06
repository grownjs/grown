$ = require('./_protocol')

Homegrown = require('..')

describe '#session', ->
  beforeEach $

  it 'should support cookie/session', (done) ->
    $.server.ctx.use Homegrown.plugs.session({ secret: 'test' })

    $.server.ctx.mount (conn) ->
      conn.put_session 'x', 'y'

    $.server.ctx.mount (conn) ->
      conn.put_resp_cookie 'x', 'y', { a: 'b' }
      conn.resp_body = conn.session.x

      $.cookies = conn.cookies

    $.server.fetch (req, next) ->
      req.headers.cookie = 'foo=bar'

      next (e, res) ->
        expect(res.cookies).toEqual { x: { value: 'y', opts: { a: 'b' } } }
        expect($.cookies).toEqual { foo: 'bar' }
        expect(res.body).toEqual 'y'
        done()
