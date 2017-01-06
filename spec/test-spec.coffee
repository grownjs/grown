$ = require('./_protocol')

describe '#test', ->
  beforeEach ->
    $()
    $.server.ctx.mount (conn) ->
      $.method = conn.req.method
      $.path = conn.req.url
      $.a = conn.req.a

  it 'can take method/path/opts as arguments', (done) ->
    $.server.fetch('put', '/x', a: 'b').then ->
      expect($.method).toEqual 'PUT'
      expect($.path).toEqual '/x'
      expect($.a).toEqual 'b'
      done()

  it 'can take path/opts arguments', (done) ->
    $.server.fetch('/x', a: 'b').then ->
      expect($.method).toEqual 'GET'
      expect($.path).toEqual '/x'
      expect($.a).toEqual 'b'
      done()

  it 'can take an object as arguments', (done) ->
    $.server.fetch(url: '/x', method: 'POST').then ->
      expect($.method).toEqual 'POST'
      expect($.path).toEqual '/x'
      done()
