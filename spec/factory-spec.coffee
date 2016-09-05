factory = require('../lib/factory')

describe '#factory', ->
  it 'should fail with unsupported values', ->
    expect(-> factory()).toThrow()
    expect(-> factory({})).toThrow()

  it 'supports plain objects with .call', ->
    fn = { call: -> 42 }

    expect(factory(fn).name).toEqual 'call'
    expect(factory(fn).call).toEqual [fn, 'call']
    expect(factory(fn).type).toEqual 'method'

  it 'supports iterators', ->
    fn = { next: -> { done: true, value: 42 } }

    expect(factory(fn).name).toEqual 'next'
    expect(factory(fn).call).toEqual fn
    expect(factory(fn).type).toEqual 'iterator'

  it 'supports generators', ->
    e = null

    try
      fn = eval('(function*(){yield 42})')
    catch _e
      e = _e

    if parseFloat(process.version.substr(1)) >= 4.0
      expect(e).toBe null
      expect(factory(fn).name).toEqual '*'
      expect(factory(fn).call).toEqual fn
      expect(factory(fn).type).toEqual 'generator'

  it 'supports class-like methods', ->
    fn = class Klass
      call: -> 42

    expect(factory(fn).name).toEqual 'Klass'
    expect(factory(fn).call).toEqual [new Klass(), 'call']
    expect(factory(fn).type).toEqual 'method'

  it 'supports express-middleware functions', (done) ->
    fn = (req, res, next) -> next()
    err = (req, res, next) -> next(42)

    expect(factory(fn).name).toEqual 'fn'
    expect(factory(fn).type).toEqual 'function'

    conn =
      next: -> new Promise (resolve) ->
        resolve conn

    factory(fn).call(conn).then ->
      factory(err).call(conn).catch (error) ->
        expect(error).toEqual 42
        done()

  it 'supports express-middleware functions (error handlers)', (done) ->
    fn = (err, req, res, next) -> next()
    err = (err, req, res, next) -> next(err)

    expect(factory(err).name).toEqual 'err'
    expect(factory(err).type).toEqual 'function'

    conn =
      next: -> new Promise (resolve, reject) ->
        reject(42)

    factory(fn).call(conn).then ->
      factory(err).call(conn).catch (error) ->
        expect(error).toEqual 42
        done()

  it 'supports plain functions', ->
    fn = -> 42

    expect(factory(fn).name).toEqual 'fn'
    expect(factory(fn).call).toEqual fn
    expect(factory(fn).type).toEqual 'function'
