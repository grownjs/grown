Sequelize = require('sequelize')
model = require('../model')
conn = null

module.exports = (type, value, params) ->
  (done) ->
    _value =
      type: type

    _value[k] = v for k, v of params

    T = model "test_#{type}",
      $schema:
        properties:
          value: _value
      , conn

    T.sync(force: true).then ->
      params = { value } if value?

      T.create(params).then (test) ->
        expect(test.get('value')).toEqual value
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
