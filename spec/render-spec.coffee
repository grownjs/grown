{ resolve } = require('path')

$ = require('./_protocol')

Homegrown = require('..')

useConfig = (name) ->
  $.server.ctx.use Homegrown.plugs.render(resolve(__dirname, '_fixtures', name))

describe '#render', ->
  beforeEach $

  it 'should fail on undefined `cwd` option', ->
    expect(-> $.server.use Homegrown.plugs.render()).toThrow()

  it 'should render single views as blocks', (done) ->
    useConfig 'app'

    $.server.ctx.mount (conn) ->
      conn.render 'example', foo: 'bar'

    $.server.fetch().then (res) ->
      expect(res.body).toContain '<!doctype html>'
      expect(res.body).toContain '<p>TEXT(bar)</p>'
      expect(res.body).toMatch /Done in \d\.\d+ms/
      done()

  it 'should render multiple views as lists', (done) ->
    useConfig 'app'

    $.server.ctx.mount (conn) ->
      conn.render 'example', foo: 'FOO'
      conn.render 'example', foo: 'FUU'
      conn.render 'example', foo: 'FUA'

    $.server.fetch().then (res) ->
      expect(res.body).toContain '<p>TEXT(FOO),TEXT(FUU),TEXT(FUA)</p>'
      done()
