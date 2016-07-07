path = require('path')

$ = require('./_protocol')

describe '#router', ->
  beforeEach $

  it 'should responds to unsupported requests with 405', (done) ->
    $.server.use require('../router')(path.resolve(__dirname, '../example'))

    $.client (req, next) ->
      next (e, res) ->
        expect(res.statusMessage).toEqual 'Method Not Allowed'
        expect(res.statusCode).toEqual 405
        done()
