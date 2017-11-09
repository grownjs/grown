Grown = require('../grown')

Grown.use require('../test')

describe 'Grown', ->
  it 'is a function', ->
    expect(typeof Grown).toEqual 'function'
    expect(typeof Grown.new).toEqual 'function'

  it 'expects cwd and env', ->
    expect(-> new Grown()).toThrow()
    expect(-> new Grown({ foo: 'bar' })).toThrow()
    expect(-> new Grown({ env: 1, cwd: 2 })).not.toThrow()

  describe '#version', ->
    it 'will be the package version', ->
      expect(require('../../package.json').version).toEqual Grown.version

  describe '#module', ->
    it 'can access its module definition', ->
      expect(Grown.Dummy).toBeUndefined()

      Grown.module 'Dummy',
        props:
          value: 42

      expect(Grown.Dummy.new().value).toEqual 42

  describe '#use', ->
    it 'can load new module definitions', ->

  describe 'Instance', ->
    beforeEach ->
      @g = Grown.new({
        cwd: __dirname
        env: 'development'
      })

      @g.plug Grown.Test

    describe '#plug -> #mount -> #listen', ->
      it 'can extend the current instance', (done) ->
        g = @g.plug Grown.Dummy

        expect(g).toBe @g

        test = null

        g.mount (conn) ->
          test = conn.value

        g.request (err, result) ->
          expect(test).toBe 42
          done()

    describe 'Event emitter', ->
      it 'can chain many method calls', ->
        cb = ->
        expect(@g.on('x', cb).off('x', cb)).toBe @g

      it 'will emit asynchronously', (done) ->
        call = null

        @g.on 'async', ->
          new Promise (ok) ->
            setTimeout ->
              call = true
              ok()
            , 100

        @g.emit('async').then ->
          expect(call).toBe true
          done()

      it 'will emit in sequence', ->
        call = []

        @g.on 'async-seq', ->
          new Promise (ok) ->
            setTimeout ->
              call.push(1)
              ok()
            , 200

        @g.on 'async-seq', ->
          new Promise (ok) ->
            setTimeout ->
              call.push(2)
              ok()
            , 100

        @g.emit('async-seq').then ->
          expect(call).toEqual [1, 2]
          done()
