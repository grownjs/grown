{ resolve } = require('path')

Grown = require('..')
util = require('../lib/util')
models = require('../lib/plugs/models')

$ = models({
  settings: resolve(__dirname, '_fixtures/app/config/database.js')
  folders: resolve(__dirname, '_fixtures/app/models')
})

describe '#models', ->
  beforeEach (done) ->
    @ctx = new Grown()
    $(@ctx, util)

    @ctx.emit('start').then =>
      @models = @ctx.extensions('Conn._.models')
      done()

  it 'should load all models hierarchically', ->
    expect(@models.Single).not.toBeUndefined()
    expect(@models.Parent).not.toBeUndefined()
    expect(@models.ParentChild).not.toBeUndefined()

  it 'should sync all models without issues', (done) ->
    { sync, Single } = @models

    sync(force: true)
      .then -> Single.describe()
      .then (x) ->
        expect(x.id.type).toEqual 'INTEGER'
        expect(x.id.primaryKey).toBe true
        done()
