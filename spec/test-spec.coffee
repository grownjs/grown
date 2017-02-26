$ = require('./_protocol')

describe '#test', ->
  beforeEach $

  it 'can take method/path/opts as arguments', (done) ->
    $.server.mount (conn) ->
      expect(conn.req.method).toEqual 'PUT'
      expect(conn.req.url).toEqual '/x'
      expect(conn.req.a).toEqual 'b'

    # all fetch() calls will return a Promise
    $.server.fetch('/x', 'put', a: 'b').then done

  it 'can take path/opts arguments', (done) ->
    $.server.mount (conn) ->
      expect(conn.req.method).toEqual 'GET'
      expect(conn.req.url).toEqual '/x'
      expect(conn.req.a).toEqual 'b'

    $.server.fetch('/x', a: 'b').then done

  it 'can take an object as arguments', (done) ->
    $.server.mount (conn) ->
      expect(conn.req.method).toEqual 'POST'
      expect(conn.req.url).toEqual '/x'

    $.server.fetch(url: '/x', method: 'POST').then done

  it 'can pass a custom handler as callback', (done) ->
    $.server.mount (conn) ->
      expect(conn.req.x).toEqual 'y'

      # method is always in UPERCASE
      expect(conn.method).toEqual 'Z'

      # all headers values are treated as strings
      expect(conn.req_headers['content-length']).toEqual '-1'

    $.server.fetch (req) ->
      # alter the request instance
      req.x = 'y'

      # the request should be returned
      req

    # optional method
    , 'z'

    # more options...
    , { headers: { 'content-length': -1 } }

    # returns a Promise too
    .then done
