/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const td = require('testdouble');

/* global beforeEach, describe, it */

let Grown;
describe('Grown.Model', () => {
  beforeEach(() => {
    Grown = require('../../bud')();
    Grown.use(require('../../server'));
    Grown.use(require('../../test'));
    Grown.use(require('..'));
  });

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

  describe('CLI', () => {
    it('should integrate json-schema-sequelizer CLI module', () => {
      expect(typeof Grown.Model.CLI.usage).to.eql('function');
      expect(typeof Grown.Model.CLI.execute).to.eql('function');
    });
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

    describe('bundle', () => {
      const postgresConn = {
        logging: false,
        dialect: 'postgres',
        username: 'postgres',
        password: 'postgres',
        database: 'schema_dev',
      };

      let container;
      beforeEach(async () => {
        container = await Grown.Model.DB.bundle({
          models: `${__dirname}/fixtures/models`,
          database: {
            config: process.env.CI ? postgresConn : sqliteMemory,
            refs: require('./fixtures/generated/index.json'),
          },
        });
      });

      it('should let you load models into a single repository', () => {
        const Example = container.get('Example');

        expect(Example.name).to.eql('ExampleModel');
        expect(typeof Example.getSchema).to.eql('function');

        return container.connect()
          .then(() => process.env.CI && container.sync({ force: true }))
          .then(() => {
            expect(container.get('Example').name).to.eql('Example');
            expect(container.get('Example').callMe()).to.eql(42);
            expect(typeof container.get('Example').getSchema).to.eql('function');
            expect(container.get('Example').options.sequelize).not.to.be.undefined;
          });
      });

      it('should allow to validate definitions through getSchema()', () => {
        // checks for User|Token|Session could fail due mutual refs
        container.get('Role').getSchema().assert(container.get('Role').getSchema().fakeOne());
        container.get('Permission').getSchema().assert(container.get('Permission').getSchema().fakeOne());
        expect(container.get('User').getSchema('someParams').fakeOne({ alwaysFakeOptionals: true }).value).to.eql('OSOM');
      });
    });
  });

  describe('Entity', () => {
    let Model;
    beforeEach(() => {
      Model = Grown.Model.Entity.define('X', { connection: sqliteMemory, $schema });
    });

    it('should be able to define new entities', () => {
      expect(() => Model.getSchema().assert({ value: 123 })).to.throw(/Invalid input for Example/);

      return Model.connect()
        .then(Example => {
          expect(Model.name).to.eql('XModel');
          expect(Example.name).to.eql('Example');
          expect(Example.getSchema().assert({ value: '123' })).to.be.true;
          expect(typeof Example.getSchema().fakeOne().value).to.eql('string');
        });
    });

    it('should fail on invalid definitions, e.g. hooks', async () => {
      const WithInvalidHooks = Model({ hooks: { undef() {} } });

      let error;
      try {
        await WithInvalidHooks.connect();
      } catch (e) {
        error = e;
      }
      expect(error.stack).to.contains('getProxiedHooks');
    });

    it('should load hooks if present otherwise', () => {
      const WithValidHooks = Model({ hooks: { beforeCreate: td.func() } });

      return WithValidHooks.connect()
        .then(Entity => Entity.sync({ force: true }))
        .then(Entity => Entity.create({ value: 'X' }))
        .then(() => {
          expect(td.explain(WithValidHooks.hooks.beforeCreate).callCount).to.eql(1);
        });
    });
  });

  describe('Repo', () => {
    function makeServer(db) {
      const server = new Grown();

      server.plug(Grown.Test);
      server.plug(Grown.Model.Formator({
        prefix: '/db',
        options: { attributes: false },
        database: db,
      }));

      return server;
    }

    function getDatabase() {
      const { repo } = Grown.Model.DB.register('repo', { config: { ...sqliteMemory } });

      repo.add({ $schema });

      return repo;
    }

    it('should responds to RESTful calls', () => {
      const repo = getDatabase();
      const server = makeServer(repo);

      return repo.connect()
        .then(() => repo.sync())
        .then(() => server.request('/db', (err, conn) => conn.res.ok(err, /"Example"/)))
        .then(() => server.request('/db/Example', (err, conn) => conn.res.ok(err, /"primaryKeys"/)))
        .then(() => server.request('/db/main.js', (err, conn) => expect(conn.res.body).to.contain('var Schema = class extends SvelteComponent')));
    });
  });
});
