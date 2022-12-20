require('../generated')(module.exports = async (Grown, util) => {
  require('../../..')(Grown, util);

  return Grown('Models', {
    include: await Promise.all([
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
    ]),
  });
});
