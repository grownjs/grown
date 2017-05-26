# require('debug').enable('grown,grown:*')

$ = require('./_protocol')

path = require('path')

mailer = require('../lib/plugs/mailer')

describe '#mailer', ->
  beforeEach ->
    $()
    $.server.use mailer({
      handlers: path.join(__dirname, '_fixtures/app/mailers')
      folders: path.join(__dirname, '_fixtures/app/views')
    })

  it '...', (done) ->
    $.server.mount (conn) ->
      conn.mail({
        to: 'foo@candy.bar'
        subject: 'baz'
        body: 'buzz'
        bar: 'baz'
      })

    $.server.fetch().then (res) ->
      console.log res.body, '?'
      done()

    .catch (err) ->
      console.log err
      done()
