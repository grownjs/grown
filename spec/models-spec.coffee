{ resolve } = require('path')

$new = require('object-new')
Homegrown = require('../lib')

$ = Homegrown.plugs.models(resolve(__dirname, '_fixtures/app'))

describe '#models', ->
  beforeEach (done) ->
    $(@test = {
      ctx:
        extensions: $new()
      initializers: []
    })

    @test.initializers[0]()
      .then -> done()
      .catch (e) ->
        console.log e.stack
        done()

  it 'should load all models hierarchically', ->
    expect(@test.ctx.extensions.models.Single).not.toBeUndefined()
    expect(@test.ctx.extensions.models.Parent).not.toBeUndefined()
    expect(@test.ctx.extensions.models.ParentChild).not.toBeUndefined()

  it 'should sync all models without issues', (done) ->
    { sync, Single } = @test.ctx.extensions.models

    sync().then =>
      Single.create(value: 'OSOM')
        .then (result) ->
          expect(result.get('id')).toEqual 1
          expect(result.get('value')).toEqual 'OSOM'
          done()
