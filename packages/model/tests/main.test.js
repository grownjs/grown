/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

/* global beforeEach, describe, it */

describe('Grown.Model', () => {
  const sqliteMemory = {
    logging: false,
    dialect: 'sqlite',
    storage: ':memory:',
  };

  const $schema = {
    id: 'Example',
    type: 'object',
    properties: {
      value: {
        type: 'string',
      },
    },
    required: ['value'],
  };

  let Grown;

  beforeEach(() => {
    Grown = require('@grown/bud')();
    Grown.use(require('@grown/server'));
    Grown.use(require('@grown/test'));
    Grown.use(require('..'));
  });

  describe('CLI', () => {
    it('...');
  });

  describe('DB', () => {
    it('should allow to register connections', () => {
      expect(Grown.Model.DB.registered('test')).to.be.false;

      const self = Grown.Model.DB.register('test', { config: {} });

      expect(self === Grown.Model.DB).to.be.true;
      expect(Grown.Model.DB.registered('test')).to.be.true;
    });

    it('should allow to have different connections', () => {
      Grown.Model.DB.register('a', { config: { ...sqliteMemory } });
      Grown.Model.DB.register('b', { config: { ...sqliteMemory } });

      return Promise.all([
        Grown.Model.DB.a.connect(),
        Grown.Model.DB.b.connect(),
      ]).then(([a, b]) => {
        expect(a.sequelize.options.identifier).to.eql('a');
        expect(b.sequelize.options.identifier).to.eql('b');
      });
    });

    it('should allow to add model definitions', () => {
      Grown.Model.DB.register('c', { config: { ...sqliteMemory } });
      Grown.Model.DB.c.add({ $schema });

      return Grown.Model.DB.c.connect()
        .then(() => expect(Grown.Model.DB.c.models.Example).to.not.be.undefined)
        .then(() => Grown.Model.DB.c.models.Example.sync({ force: true }))
        .then(() => Grown.Model.DB.c.models.Example.create({ value: 'OSOM' }))
        .then(() => Grown.Model.DB.c.models.Example.findAll())
        .then(([head]) => {
          const row = head.get();

          expect(row.id).to.eql(1);
          expect(row.value).to.eql('OSOM');
        });
    });

    it('should let you bundle modules into a single repo', () => {
      const container = Grown.Model.DB.bundle({
        models: `${__dirname}/fixtures`,
        database: {
          config: sqliteMemory,
          refs: [],
        },
      });

      const Example = container.get('Example');

      expect(Example.name).to.eql('ExampleModel');
      expect(Example.getSchema()).not.to.be.undefined;

      return container.connect().then(() => {
        expect(container.get('Example').name).to.eql('Example');
        expect(container.get('Example').callMe()).to.eql(42);
        expect(container.get('Example').getSchema()).not.to.be.undefined;
        expect(Example === container.get('Example')).to.be.false;
      });
    });
  });

  describe('Entity', () => {
    it('should be able to define new entities', () => {
      const Model = Grown.Model.Entity.define('X', { connection: sqliteMemory, $schema });

      expect(() => Model.getSchema().assert({ value: 123 })).to.throw(/Invalid input for Example/);

      return Model.connect()
        .then(Example => {
          expect(Model.name).to.eql('XModel');
          expect(Example.name).to.eql('Example');
          expect(Example.getSchema().assert({ value: '123' })).to.be.true;
          expect(typeof Example.getSchema().fakeOne().value).to.eql('string');
        });
    });
  });

  describe('Formator', () => {
    it('...');
  });

  describe('Repo', () => {
    it('...');
  });
});
