$ = require('./_protocol')

path = require('path')

access = require('../lib/plugs/access')

describe '#access', ->
  beforeEach ->
    $()
    $.server.use access({
      handlers: path.join(__dirname, '_fixtures/app/mailers')
      folders: path.join(__dirname, '_fixtures/app/views')
    })

  it 'x', ->
    console.log 42
