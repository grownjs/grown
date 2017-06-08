$ = require('./_protocol')

path = require('path')

access = require('../lib/plugs/access')
router = require('../lib/plugs/router')

useRole = (role, end) ->
  $()

  $.server.mount (conn) ->
    conn.access = role
    conn.truth = 42 if role is 'Editor'

  $.server.use access({
    settings: path.join(__dirname, '_fixtures/app/config/policies.js')
    folders: path.join(__dirname, '_fixtures/app/lib/resources')
  })

  $.server.use router({
    settings: path.join(__dirname, '_fixtures/app/config/routes.js')
    folders: path.join(__dirname, '_fixtures/app/controllers')
  })

  $.server.mount (conn) ->
    if conn.request_path.indexOf('foo') > -1
      conn.resp_body = 'FOO'

    if conn.request_path is '/secret'
      conn.can(role, 'Secret', 'view').then ->
        conn.resp_body = 'OSOM'

  $.server.run ->
    end()

describe '#access', ->
  it 'should deny / to unknowns', (done) ->
    useRole 'Unknown', ->
      $.server.fetch('/').then (res) ->
        expect(res.statusCode).toEqual 403
        done()

  it 'should allow / to users', (done) ->
    useRole 'User', ->
      $.server.fetch('/').then (res) ->
        expect(res.statusCode).toEqual 200
        expect(res.body).toEqual 'OK'
        done()

  it 'should deny /secret to users', (done) ->
    useRole 'User', ->
      $.server.fetch('/secret').then (res) ->
        expect(res.statusCode).toEqual 403
        done()

  it 'should allow /secret to admins', (done) ->
    useRole 'Admin', ->
      $.server.fetch('/secret').then (res) ->
        expect(res.statusCode).toEqual 200
        expect(res.body).toEqual 'OSOM'
        done()

  it 'should allow /foo to guests', (done) ->
    useRole 'Guest', ->
      $.server.fetch('/foo').then (res) ->
        expect(res.statusCode).toEqual 200
        expect(res.body).toEqual 'FOO'
        done()

  it 'should deny /foo/candy/bar to unknowns', (done) ->
    useRole 'Unknown', ->
      $.server.fetch('/foo/candy/bar').then (res) ->
        expect(res.statusCode).toEqual 403
        done()

  it 'should deny Example to users', (done) ->
    useRole 'User', ->
      $.server.fetch('/example').then (res) ->
        expect(res.statusCode).toEqual 403
        done()

  it 'should allow Example to editors', (done) ->
    useRole 'Editor', ->
      $.server.fetch('/example').then (res) ->
        expect(res.statusCode).toEqual 200
        expect(res.body).toEqual 'OK'
        done()

  it 'should allow Example to editors (edit)', (done) ->
    useRole 'Editor', ->
      $.server.fetch('/example/1/edit').then (res) ->
        expect(res.statusCode).toEqual 200
        expect(res.body).toEqual 'EDIT'
        done()

  it 'should deny Example to editors (destroy)', (done) ->
    useRole 'Editor', ->
      $.server.fetch('/example/1', 'delete').then (res) ->
        expect(res.statusCode).toEqual 403
        done()

  it 'should allow Example to admins (destroy)', (done) ->
    useRole 'Admin', ->
      $.server.fetch('/example/1', 'delete').then (res) ->
        expect(res.statusCode).toEqual 200
        expect(res.body).toEqual 'DELETE'
        done()
