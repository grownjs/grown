$ = require('./_protocol')

describe '#test', ->
  beforeEach $

  it 'can take method/path/opts as arguments', (done) ->
    $.server.mount (@conn) =>
    $.server.fetch('/x', 'put', a: 'b').then =>
      expect(@conn.req.method).toEqual 'PUT'
      expect(@conn.req.url).toEqual '/x'
      expect(@conn.req.a).toEqual 'b'
      done()

  it 'can take path/opts arguments', (done) ->
    $.server.mount (@conn) =>
    $.server.fetch('/x', a: 'b').then =>
      expect(@conn.req.method).toEqual 'GET'
      expect(@conn.req.url).toEqual '/x'
      expect(@conn.req.a).toEqual 'b'
      done()

  it 'can take an object as arguments', (done) ->
    $.server.mount (@conn) =>
    $.server.fetch(url: '/x', method: 'POST').then =>
      expect(@conn.req.method).toEqual 'POST'
      expect(@conn.req.url).toEqual '/x'
      done()
