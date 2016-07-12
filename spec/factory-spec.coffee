factory = require('../lib/factory')

describe '#factory', ->
  it 'supports plain objects with .call', ->
    fn = { call: -> 42 }

    expect(factory(fn).name).toEqual 'anonymous'
    expect(factory(fn).call).toEqual [fn, 'call']
    expect(factory(fn).type).toEqual 'method'

  it 'supports iterators', ->
    fn = { next: -> { done: true, value: 42 } }

    expect(factory(fn).name).toEqual 'anonymous'
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
      expect(factory(fn).name).toEqual 'anonymous'
      expect(factory(fn).call).toEqual fn
      expect(factory(fn).type).toEqual 'generator'

  it 'supports class-like methods', ->
    fn = class Klass
      call: -> 42

    expect(factory(fn).name).toEqual 'Klass'
    expect(factory(fn).call).toEqual [new Klass(), 'call']
    expect(factory(fn).type).toEqual 'method'

  it 'supports express-middleware functions', ->
    fn = (req, res, next) -> next()

    expect(factory(fn).name).toEqual 'anonymous'
    expect(factory(fn).type).toEqual 'function'

  it 'supports express-middleware functions (error handlers)', ->
    fn = (err, req, res, next) -> next()

    expect(factory(fn).name).toEqual 'anonymous'
    expect(factory(fn).type).toEqual 'function'

  it 'supports plain functions', ->
    fn = -> 42

    expect(factory(fn).name).toEqual 'anonymous'
    expect(factory(fn).call).toEqual fn
    expect(factory(fn).type).toEqual 'function'
