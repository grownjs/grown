app = require('../app/server')
Grown = require('grown')

# FIXME: coffeelint
describe 'web pages', ->
  beforeEach Grown.test(app)
  afterEach Grown.burn

  it 'not all pages exists', (done) ->
    @fetch('/x').then (resp) ->
      expect(resp.body).toContain('Not Found')
      done()

  it 'but the homepage yes!', (done) ->
    @fetch('/').then (resp) ->
      expect(resp.body).toContain('It works!')
      done()
