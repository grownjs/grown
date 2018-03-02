#require('debug').enable '*'

Grown = null

describe 'Grown', ->
  beforeEach ->
    Grown = require('../index')()
    Grown.use require('../../test')

  it 'is a function', ->
    expect(typeof Grown).toEqual 'function'
    expect(typeof Grown.new).toEqual 'function'

  describe '#version', ->
    it 'will be the package version', ->
      expect(Grown.version).not.toBeUndefined()

  describe '#module', ->
    it 'can access its module definition', ->
      expect(Grown.Dummy).toBeUndefined()

      Grown 'Dummy',
        props:
          value: 42

      expect(Grown.Dummy.new().value).toEqual 42

  describe '#loader', ->
    it 'can load definitions from given directories', ->
      expect(Grown.loader("#{__dirname}/fixtures").Example.truth).toEqual 42

  describe '#use', ->
    it 'can load new module definitions', ->
      Grown.use ($, util) ->
        $ 'Example',
          props:
            _: util

      ex = new Grown.Example()

      expect(ex._.flattenArgs(1, [2], [[3]])).toEqual [1, 2, 3]
      expect(Object.keys(ex)).toEqual []

  describe '#do', ->
    it 'can test guard blocks as promises', (done) ->
      (Grown.do.call @, ->
        new Promise((cb) -> setTimeout(cb, 1000))
      )(done)

    describe 'rescue', ->
      beforeEach ->
        @calls = []
        @result = null

        printf = (_, msg) =>
          @calls.push 'printf'
          @result = msg.trim()

        Grown 'Logger', getLogger: -> { printf }

      afterEach ->
        delete Grown.Logger
        expect(@calls).toEqual ['guard', 'rescue', 'printf']
        expect(@result).toEqual 'Error: OK'

      it 'can use Grown.Logger if it exists', (done) ->
        (Grown.do.call @, (rescue) =>
          @calls.push 'guard'
          expect(@result).toBe null

          rescue.call @, (e) =>
            @calls.push 'rescue'
            expect(@result).toBe null

          throw 'OK'
        )(done)

  describe 'Test', ->
    beforeEach ->
      @g = Grown.new()
      @g.plug Grown.Test

    describe '#plug -> #mount -> #listen -> #request', ->
      it 'runs over the current instance', (done) ->
        g = @g.plug $mixins: props: value: 42

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
          method: 'POST'
          headers:
            'content-type': 'application/json'

        @g.request opts, (err, conn) ->
          expect(conn.req.headers['content-length']).toEqual '6'
          expect(conn.pid).not.toBeUndefined()

          conn.req.on 'data', (chunk) ->
            expect(chunk.toString()).toEqual '"OSOM"'
            done()

    describe 'Mock.Req', ->
      it 'provides a mocked request', (done) ->
        @g.run().then (conn) ->
          expect(conn.req).not.toBeUndefined()
          expect(conn.req.url).toEqual ''
          done()
        .catch (e) ->
          console.log 'E_REQ', e.stack
          done()

    describe 'Mock.Res', ->
      it 'provides a mocked response', (done) ->
        @g.mount (conn) ->
          conn.res.write 'OSOM'

        @g.run().then (conn) ->
          expect(conn.res.body).toEqual 'OSOM'
          done()
        .catch (e) ->
          console.log 'E_RES', e.stack
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

      it 'will emit in sequence', (done) ->
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
