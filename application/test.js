const Grown = require('grown')();

const Model = Grown.use(require('/Users/pate/Workspace/grown/packages/model'));

const Example = Model.Entity.define('Test', {
  $schema: {
    id: 'TestExample',
    type: 'object',
    properties: {
      value: {
        type: 'string',
      },
    },
  },
});

Example.connect({
  dialect: 'sqlite',
  storage: ':memory:',
}).then(Model => {
  return Model;
});

// scan for model definitions and returns a repo of it
const repo = Grown.Model.DB.bundle({
  models: '/Users/pate/Workspace/grown/application/api/schema/models',
  database: {
    identifier: 'test',
    config: {
      logging: false,
      dialect: 'sqlite',
      storage: ':memory:'
    },
    refs: require('/Users/pate/Workspace/grown/application/api/schema/generated')
  }
});

// connecto the repository
repo.connect().then(async () => {
  Grown.use(require('@grown/server'));
  const server = new Grown();

  const API = Grown.Model.Formator({
    database: Grown.Model.DB.test,
    prefix: '/db',
  });

  await repo.sync();

  server.plug(API);
  server.listen(8080);

  const TestRepo = API.from(repo.models.User);
  console.log(TestRepo);

  // const testCount = await TestRepo.count();

  // console.log(testCount);

  await repo.disconnect();

  // console.log(API.bind(repo.models.User));
});
