m = require('../model')

module.exports = (type, value, params) ->
  (done) ->
    _value =
      type: type

    _value[k] = v for k, v of params

    T = m "test_#{type}",
      $schema:
        properties:
          value: _value

    T.sync(force: true).then ->
      params = { value } if value?

      T.create(params).then (test) ->
        expect(test.get('value')).toEqual value
        done()
