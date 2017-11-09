Grown = require('../lib')

$ = null

describe '#uws', ->
  beforeEach (done) ->
    $ = Grown.new
      cwd: __dirname
      env: 'testing'

    $.mount (conn) ->
      conn.resp_body = 'OK'

    $.listen('uws://0.0.0.0:3000').then ->
      done()
    .catch (e) ->
      console.log e.message
      done()

  it 'should be ok', (done) ->
    $.stop().then ->
      done()

      setTimeout ->
        process.exit()
