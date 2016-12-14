{ resolve } = require('path')

$ = require('../models')(resolve(__dirname, '_fixtures'))

describe '#models', ->
  beforeEach ->
    $ @ctx = extensions: {}

  it 'should sync all models without issues', (done) ->
    @ctx.extensions.models.sync().then -> done()

  it 'should load all models hierarchically', ->
    expect(@ctx.extensions.models.Single).not.toBeUndefined()
    expect(@ctx.extensions.models.Parent).not.toBeUndefined()
    expect(@ctx.extensions.models.ParentChild).not.toBeUndefined()
