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
        conn.resp_body = conn.params

    $.server.fetch('/', 'post', {
      body:
        foo: 'bar'
      headers:
        'content-type': 'multipart/form-data'
        'accept': 'application/json'
    })

    .then (res) ->
      expect(res.json).toEqual { foo: 'bar' }
      done()

   # TODO: octet-stream
