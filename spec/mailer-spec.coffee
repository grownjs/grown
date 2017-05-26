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

  it 'should by-pass transport as default', (done) ->
    $.server.mount (conn) ->
      conn.mail({
        to: 'foo@candy.bar'
      }).then (x) ->
        conn.resp_body = x
        conn.end()

    $.server.fetch().then (res) ->
      expect(res.json.status).toEqual 'sent'
      expect(res.json.result.subject).toEqual 'OSOMS'
      expect(res.json.result.from).toEqual 'admin@example.com'
      expect(res.json.result.to).toEqual 'foo@candy.bar'
      expect(res.json.result.html).toContain 'EMPTY'
      done()

    .catch (err) ->
      console.log err
      done()
