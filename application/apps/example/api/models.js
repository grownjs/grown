const path = require('path');

module.exports = Shopfish => {
  Shopfish.use(require('@grown/model/db'));
  Shopfish.use(require('@grown/model/cli'));

  return Shopfish('MyModels', {
    include: [
      Shopfish.Model.DB.bundle({
        models: path.join(__dirname, 'schema/models'),
        database: {
          refs: require('~/etc/schema/generated'),
          identifier: 'test',
          config: {
            logging: false,
            dialect: 'sqlite',
            storage: ':memory:',
          },
        },
      }),
    ],
  });
};

