require('../generated')(module.exports = Grown => {
  Grown.use(require('../../..'));

  return Grown('Models', {
    include: [
      Grown.Model.DB.bundle({
        types: `${Grown.cwd}/tests/fixtures/generated`,
        models: `${Grown.cwd}/tests/fixtures/models`,
        database: {
          refs: require('../generated/index.json'),
          config: {
            logging: false,
            dialect: 'postgres',
            database: 'schema_dev',
          },
        },
      }),
    ],
  });
});
