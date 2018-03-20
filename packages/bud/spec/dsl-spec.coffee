stdMocks = require('std-mocks')
procExit = process.exit

Grown = null

describe 'Grown', ->
  beforeEach ->
    Grown = require('../index')()

  it 'is a function', ->
    expect(typeof Grown).toEqual 'function'
    expect(typeof Grown.new).toEqual 'function'

  describe '#module', ->
    it 'can access its module definition', ->
      expect(Grown.Dummy).toBeUndefined()

      Grown 'Dummy',
        props:
          value: 42

      expect(Grown.Dummy.new().value).toEqual 42

  describe '#load', ->
    it 'can load definitions from given directories', ->
      expect(Grown.load("#{__dirname}/fixtures").Example.truth).toEqual 42

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
        stdMocks.use()
        process.exit = =>
          @calls.push 'exit'

      afterEach ->
        stdMocks.restore()
        process.exit = procExit
        result = stdMocks.flush()

        expect(result.stdout).toEqual []
        expect(result.stderr[0]).toContain 'Error: OK'
        expect(@calls).toEqual ['guard', 'rescue', 'exit']

      it 'will output to stderr', (done) ->
        (Grown.do.call @, (rescue) =>
          @calls.push 'guard'

          rescue.call @, (e) =>
            @calls.push 'rescue'

          throw 'OK'
        )(done)
