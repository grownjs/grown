pipeline = require('../lib/pipeline')

stub = (name, fn) ->
  call: fn
  name: name
  type: 'function'

next = (name, fn) ->
  call:
    next: fn
  name: name
  type: 'iterator'

gen = (name, fn) ->
  call: fn
  name: name
  type: 'generator'

describe '#pipeline', ->
  it 'should fail with unsupported values', ->
    expect(-> pipeline()).toThrow()
    expect(-> pipeline('x')).toThrow()
    expect(-> pipeline('x', ->)).toThrow()
    expect(-> pipeline('x', [], -1)).toThrow()

  it 'should fail if the pipeline is already done', ->
    expect(-> pipeline('x', [])(done: true)).toThrow()

  it 'should short-circuit when state.done is true', (done) ->
    count = 0

    fn = stub 'increment', (state) ->
      state.done = true if count
      count++

    p = pipeline 'short-circuit', [fn, fn, fn, fn, fn]
    p().then ->
      expect(count).toEqual 2
      done()

  it 'should allow next() continuations', (done) ->
    results = []

    start = stub 'start', (state) ->
      state.next ->
        results.push('start')

    end = stub 'end', -> results.push('end')

    p = pipeline 'next-continuations', [start, end]
    p().then ->
      expect(results).toEqual ['end', 'start']
      done()

  describe 'iterator support', ->
    it 'can resolve boolean values', (done) ->
      fn = next 'boolean', (state) ->
        state.boolean = true if typeof state is 'object'
        { done: typeof state is 'boolean', value: true }
      p = pipeline 'boolean-values', [fn]
      p().then (state) ->
        expect(state.boolean).toBe true
        done()

    it 'can resolve number values', (done) ->
      fn = next 'number', (state) ->
        state.number = 42 if typeof state is 'object'
        { done: typeof state is 'number', value: 42 }
      p = pipeline 'number-values', [fn]
      p().then (state) ->
        expect(state.number).toEqual 42
        done()

    it 'can resolve string values', (done) ->
      fn = next 'string', (state) ->
        state.string = 'ok' if typeof state is 'object'
        { done: typeof state is 'string', value: 'ok' }
      p = pipeline 'string-values', [fn]
      p().then (state) ->
        expect(state.string).toEqual 'ok'
        done()

    it 'can resolve promise values', (done) ->
      fn = next 'promise', (state) ->
        state.promise = 42 if typeof state is 'object'
        { done: typeof state isnt 'object', value: Promise.resolve(42) }
      p = pipeline 'promise-values', [fn]
      p().then (state) ->
        expect(state.promise).toEqual 42
        done()

    it 'can resolve pipeline values', (done) ->
      fn = next 'pipe', (state) ->
        state.pipe = 42
        { done: typeof state isnt 'object', value: (state) -> state.pipe += 42 }
      p = pipeline 'pipe-values', [fn]
      p().then (state) ->
        expect(state.pipe).toEqual 84
        done()

    it 'should catch all error values', (done) ->
      fn = next 'errors', (state) ->
        state.error = 1 if typeof state is 'object'
        {
          done: typeof state isnt 'object'
          value: new Promise(-> throw new Error 'KO')
        }

      p = pipeline 'error-values', [fn]
      p().catch (error) ->
        expect(error.message).toEqual 'KO'
        done()

  try
    _gen = eval('(function*(){})')
  catch _e

  if _gen
    describe 'generator support', ->
      it 'can yield simple scalar values', (done) ->
        fn = gen '...',
          eval '(function* (state) { state.number = yield 42; })'

        p = pipeline 'yield-scalar-values', [fn]
        p().then (state) ->
          expect(state.number).toEqual 42
          done()

      it 'can yield promise values', (done) ->
        fn = gen '...',
          eval '''
            (function* (state) {
              state.boolean = yield Promise.resolve(true);
            })
          '''

        p = pipeline 'yield-promise-values', [fn]
        p().then (state) ->
          expect(state.boolean).toEqual true
          done()
