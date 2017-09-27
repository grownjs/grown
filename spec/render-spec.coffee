{ resolve } = require('path')

fs = require('fs')

$ = require('./_protocol')

render = require('../lib/plugs/render')

describe '#render', ->
  beforeEach $

  beforeEach ->
    $.server.use render({
      folders: resolve(__dirname, '_fixtures/app/views')
    })

  it 'should append single views as blocks', (done) ->
    $.server.mount (conn) ->
      conn.view('example', foo: 'bar', as: 'yield').end()

    $.server.fetch().then (res) ->
      expect(res.body).toContain '<body>'
      expect(res.body).toContain '<p>TEXT(bar)</p>'
      done()

  it 'should append multiple views as lists', (done) ->
    $.server.mount (conn) ->
      conn.view 'example', foo: 'FOO', as: 'yield'
      conn.view 'example', foo: 'FUU', as: 'yield'
      conn.view 'example', foo: 'FUA', as: 'yield'
      conn.end()

    $.server.fetch().then (res) ->
      expect(res.body).toContain '<body>'
      expect(res.body).toContain '<p>TEXT(FOO)TEXT(FUU)TEXT(FUA)</p>'
      done()

  it 'should render using the default layout', (done) ->
    $.server.mount (conn) ->
      conn.end('OK')

    $.server.fetch().then (res) ->
      expect(res.body).toContain '<body>'
      expect(res.body).toContain '<p>OK</p>'
      done()

  it 'should reduce promises and streams', (done) ->
    $.server.mount (conn) ->
      conn.view 'example',
        foo: fs.createReadStream(__filename)
        bar: Promise.resolve(42)
        as: 'yield'
      conn.end()

    $.server.fetch().then (res) ->
      expect(res.body).toContain "TEXT(#{fs.readFileSync(__filename).toString()}42)"
      done()

  it 'should render functions', (done) ->
    $.server.mount (conn) ->
      conn.layout = (locals) -> locals.yield
      conn.view (locals) -> 'FOO'
      conn.view (locals, h) -> h('span', null, 'BAR')
      conn.end()

    $.server.fetch().then (res) ->
      expect(res.body).toEqual 'FOO<span>BAR</span>'
      done()
