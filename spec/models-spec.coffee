{ resolve } = require('path')

Homegrown = require('../lib')

$ = Homegrown.plugs.models(resolve(__dirname, '_fixtures/app'))

describe '#models', ->
  beforeEach (done) ->
    $(@ctx = extensions: {}).then -> done()

  it 'should load all models hierarchically', ->
    expect(@ctx.extensions.models.Single).not.toBeUndefined()
    expect(@ctx.extensions.models.Parent).not.toBeUndefined()
    expect(@ctx.extensions.models.ParentChild).not.toBeUndefined()

  it 'should sync all models without issues', (done) ->
    { sync, Single } = @ctx.extensions.models

    sync().then =>
      Single.create(value: 'OSOM')
        .then (result) ->
          expect(result.get('id')).toEqual 1
          expect(result.get('value')).toEqual 'OSOM'
          done()
