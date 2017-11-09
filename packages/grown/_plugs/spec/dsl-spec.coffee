#require('debug').enable '*'

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
      Grown.use ($, util) ->
        $.module 'Example',
          props:
            _: util

      ex = new Grown.Example()

      expect(ex._.ucwords('a b c')).toEqual 'A b c'
      expect(Object.keys(ex)).toEqual []

  describe 'Test', ->
    beforeEach ->
      @g = Grown.new({
        cwd: __dirname
        env: 'development'
      })

      @g.plug Grown.Test

    describe '#plug -> #mount -> #listen -> #request', ->
      it 'runs over the current instance', (done) ->
        g = @g.plug Grown.Dummy

        expect(g).toBe @g

        test = null

        g.mount (conn) ->
          test = conn.value

        g.request ->
          expect(test).toBe 42
          done()

      it 'should normalize the request body', (done) ->
        opts =
          body: '"OSOM"'
          headers:
            'content-type': 'application/json'

        @g.plug Grown.Test.Mock.Req

        @g.request opts, (err, conn) ->
          expect(conn.pid).not.toBeUndefined()
          expect(conn.req.headers['content-length']).toEqual '6'
          done()

    describe 'Mock.Req', ->
      it 'provides a mocked request', (done) ->
        @g.plug Grown.Test.Mock.Req
        @g.run().then (conn) ->
          expect(conn.req).not.toBeUndefined()
          expect(conn.req.url).toEqual ''
          done()
        .catch (e) ->
          console.log 'E_REQ', e.stack
          done()

    describe 'Mock.Res', ->
      it 'provides a mocked response', (done) ->
        @g.plug Grown.Test.Mock.Res

        @g.mount (conn) ->
          conn.res.write 'OSOM'

        @g.run().then (conn) ->
          expect(conn.res.body).toEqual 'OSOM'
          done()
        .catch (e) ->
          console.log 'E_RES', e.stack
          done()

    describe 'Mock', ->
      it 'will plug both middlewares', (done) ->
        @g.plug Grown.Test.Mock
        @g.run().then (conn) ->
          expect(conn.req).not.toBeUndefined()
          expect(conn.res).not.toBeUndefined()
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
