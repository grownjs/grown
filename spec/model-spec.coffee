t = require('./_checktype')

describe '#model', ->
  describe 'JSON-Schema -> Sequelize models', ->
    describe 'basic types', ->
      beforeEach ->
        t.setup 'sqlite', ':memory:'

      #it 'support null', t('integer', null)
      it 'support string', t('string', 'OK')
      it 'support number', t('number', '1.1')
      it 'support integer', t('integer', 1)
      it 'support boolean', t('boolean', true)

    describe 'postgres types (postgres)', ->
      beforeEach ->
        t.setup 'postgres'

      it 'support arrays',
        t 'array', [1, 2, 3],
          items:
            type: 'integer'

      it 'support objects',
        t 'object', { foo: 'bar' },
          properties:
            foo:
              type: 'string'

      it 'support virtual values',
        t 'virtual', -1,
          get: -> 42
          return: 'integer'
          unsigned: true
          zerofill: true
