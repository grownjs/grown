Sequelize = require('sequelize')
model = require('../model')
conn = null

module.exports = (type, actual, expected, params...) ->
  (done) ->
    _value =
      type: type

    params.forEach (props) ->
      _value[k] = v for k, v of props

    T = model "test_#{type}",
      $schema:
        properties:
          value: _value
      , conn

    T.sync(force: true).then ->
      T.create({ value: actual }).then (test) ->
        expect(test.get('value')).toEqual expected
        done()

module.exports.setup = (dialect, storage) ->
  conn = new Sequelize
    username: if process.env.CI then 'postgres' else process.env.LOGNAME
    database: if process.env.CI then 'travis_ci_test' else 'test'
    dialect: dialect
    storage: storage
    logging: false
    define:
      timestamps: false
      freezeTableName: true
  null
