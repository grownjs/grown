{ resolve } = require('path')

$ = require('../models')(resolve(__dirname, '_fixtures'))

describe '#model', ->
  it 'should load all models hierarchically', ->
    ctx =
      extensions: {}

    # TODO
    #console.log $ ctx
    #console.log ctx
