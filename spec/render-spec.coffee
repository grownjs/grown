{ resolve } = require('path')

$ = require('./_protocol')

render = require('../lib/plugs/render')

useConfig = (name) ->
  $.server.use render(resolve(__dirname, '_fixtures', name))

describe '#render', ->
  beforeEach $

  it 'should render single views as blocks', (done) ->
    useConfig 'app'

    $.server.mount (conn) ->
      conn.render 'example', foo: 'bar'

    $.server.fetch().then (res) ->
      expect(res.body).toContain '<!doctype html>'
      expect(res.body).toContain '<p>TEXT(bar)</p>'
      done()

  it 'should render multiple views as lists', (done) ->
    useConfig 'app'

    $.server.mount (conn) ->
      conn.render 'example', foo: 'FOO'
      conn.render 'example', foo: 'FUU'
      conn.render 'example', foo: 'FUA'

    $.server.fetch().then (res) ->
      expect(res.body).toContain '<p>TEXT(FOO),TEXT(FUU),TEXT(FUA)</p>'
      done()
