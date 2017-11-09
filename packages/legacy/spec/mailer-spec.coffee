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
      conn.mailer({
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

  it 'should call external transports', (done) ->
    $.server.mount (conn) ->
      conn.mailer({
        layout: 'external'
        to: 'foo@candy.bar'
      }).then (x) ->
        conn.resp_body = x
        conn.end()

    $.server.fetch().then (res) ->
      expect(res.json.status).toEqual 'sent'

      if process.env.SMTP_HOST
        expect(res.json.result.accepted).toEqual ['foo@candy.bar']
      else
        expect(res.json.result.test).toEqual 42

      done()

  it 'should call inline transports', (done) ->
    $.server.mount (conn) ->
      conn.mailer({
        transport: (ctx) ->
          sendMail: (opts, x) ->
            opts.foo = 'bar'
            x(null, opts)
        to: 'foo@candy.bar'
      }).then (x) ->
        conn.resp_body = x
        conn.end()

    $.server.fetch().then (res) ->
      expect(res.json.status).toEqual 'sent'
      expect(res.json.result.foo).toEqual 'bar'
      expect(res.json.result.html).toContain 'EMPTY'
      done()
