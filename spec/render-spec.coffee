{ resolve } = require('path')

$ = require('./_protocol')

render = require('../lib/plugs/render')

useConfig = (name) ->
  $.server.use render(resolve(__dirname, '_fixtures', name))

describe '#render', ->
  beforeEach $

  it 'should append single views as blocks', (done) ->
    useConfig 'app'

    $.server.mount (conn) ->
      conn.view 'example', foo: 'bar'

    $.server.fetch().then (res) ->
      expect(res.body).toContain '<!doctype html>'
      expect(res.body).toContain '<p>TEXT(bar)</p>'
      done()

  it 'should append multiple views as lists', (done) ->
    useConfig 'app'

    $.server.mount (conn) ->
      conn.view 'example', foo: 'FOO'
      conn.view 'example', foo: 'FUU'
      conn.view 'example', foo: 'FUA'

    $.server.fetch().then (res) ->
      expect(res.body).toContain '<p>TEXT(FOO),TEXT(FUU),TEXT(FUA)</p>'
      done()
