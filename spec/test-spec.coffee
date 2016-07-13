$ = require('./_protocol')

describe '#test', ->
  beforeEach ->
    $()
    $.server.mount (conn) ->
      $.method = conn.req.method
      $.path = conn.req.url
      $.a = conn.req.a

  it 'can take method/path/opts as arguments', (done) ->
    $.client.fetch('put', '/x', a: 'b').then ->
      expect($.method).toEqual 'PUT'
      expect($.path).toEqual '/x'
      expect($.a).toEqual 'b'
      done()

  it 'can take path/opts arguments', (done) ->
    $.client.fetch('/x', a: 'b').then ->
      expect($.method).toEqual 'GET'
      expect($.path).toEqual '/x'
      expect($.a).toEqual 'b'
      done()

  it 'can take an object as arguments', (done) ->
    $.client.fetch(url: '/x', method: 'POST').then ->
      expect($.method).toEqual 'POST'
      expect($.path).toEqual '/x'
      done()
