{ resolve } = require('path')

$ = require('./_protocol')

Homegrown = require('..')

useConfig = (name) ->
  $.server.ctx.use Homegrown.plugs.render(resolve(__dirname, '_fixtures', name))

describe '#render', ->
  beforeEach $

  it 'should fail on undefined `cwd` option', ->
    expect(-> $.server.use Homegrown.plugs.render()).toThrow()

  it 'should render views as blocks', (done) ->
    useConfig 'app'

    $.server.ctx.mount (conn) ->
      conn.render 'example', foo: 'bar'

    $.client.fetch().then (res) ->
      expect(res.body).toContain '<!doctype html>'
      expect(res.body).toContain '<p>TEXT(bar)</p>'
      expect(res.body).toMatch /Done in \d\.\d+ms/
      done()
