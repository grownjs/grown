{ resolve } = require('path')

$ = require('./_protocol')

useConfig = (name) ->
  $.server.use require('../router')(resolve(__dirname, '../examples', name))

describe '#router', ->
  beforeEach $

  it 'should responds to unsupported requests with 405', (done) ->
    useConfig 'no-routes'

    $.client (req, next) ->
      next (e, res) ->
        expect(res.statusMessage).toEqual 'Method Not Allowed'
        expect(res.statusCode).toEqual 405
        done()
