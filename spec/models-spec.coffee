t = require('./_checktype')

describe '#model', ->
  describe 'JSON-Schema -> Faking support', ->
    it 'should fake simple objects', ->
      t.setup 'sqlite', ':memory:'

      FakeModel = t.define('test',
        properties: value: enum: ['OK']
        required: ['value']
      ).fake()

      sample = FakeModel.findAll()

      expect(sample.length > 0).toBe true
      expect(sample[0]).toEqual { value: 'OK' }

      expect(FakeModel.fake().findOne().value).toEqual 'OK'

  describe 'JSON-Schema -> Sequelize models', ->
    describe 'basic types (sqlite3)', ->
      beforeEach ->
        t.setup 'sqlite', ':memory:'

      it 'support null', t('null', null, null)
      it 'support string', t('string', 'OK', 'OK')
      it 'support number', t('number', '1.1', '1.1')
      it 'support integer', t('integer', 1, 1)
      it 'support boolean', t('boolean', true, true)

    describe 'object types (postgres)', ->
      beforeEach ->
        t.setup 'postgres'

      it 'support arrays',
        t 'array', [1, 2, 3], [1, 2, 3],
          items:
            type: 'integer'

      it 'support objects',
        t 'object', { foo: 'bar' }, { foo: 'bar' },
          properties:
            foo:
              type: 'string'

    describe 'virtual types (sequelize)', ->
      it 'support any values', t('virtual', 42, 42)
