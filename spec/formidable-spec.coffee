$ = require('./_protocol')

formidable = require('../lib/plugs/formidable')

describe 'Formidable', ->
  beforeEach $

  it 'supports application/json', (done) ->
    $.server.use formidable()

    $.server.mount (conn) ->
     conn.upload_files().then ->
       conn.resp_body = conn.params

    $.server.fetch('/', 'post', {
      body: '{"foo":"bar"}'
      headers:
        'content-type': 'application/json'
        'accept': 'application/json'
    })

    .then (res) ->
      expect(res.json).toEqual { foo: 'bar' }
      done()

  it 'supports query-params', (done) ->
    $.server.use formidable()

    $.server.mount (conn) ->
      conn.upload_files().then ->
        conn.resp_body = conn.params

    $.server.fetch('/', 'post', {
      body: 'foo=bar'
      headers:
        'content-type': 'urlencoded'
        'accept': 'application/json'
    })

    .then (res) ->
      expect(res.json).toEqual { foo: 'bar' }
      done()

  it 'supports multipart', (done) ->
    $.server.use formidable()

    $.server.mount (conn) ->
      conn.upload_files().then ->
        conn.resp_body = [conn.params, conn.uploaded_files]

    $.server.fetch('/', 'post', {
      body:
        foo: 'bar'
      headers:
        'content-type': 'multipart/form-data'
        'accept': 'application/json'
      attachments: [
        { name: 'example', path: __filename }
      ]
    })

    .then (res) ->
      expect(res.json[0]).toEqual { foo: 'bar' }
      expect(res.json[1].example.type).toEqual 'text/coffeescript'
      expect(res.json[1].example.name).toEqual 'formidable-spec.coffee'
      done()

   # TODO: octet-stream
