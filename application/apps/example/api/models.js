const path = require('path');

module.exports = Shopfish => {
  Shopfish.use(require('@grown/model/db'));
  Shopfish.use(require('@grown/model/cli'));

  return Shopfish('MyModels', {
    include: [
      Shopfish.Model.DB.bundle({
        models: path.join(__dirname, 'schema/models'),
        database: {
          refs: require('~/etc/schema/generated').example,
          identifier: 'example',
          config: {
            logging: false,
            dialect: 'sqlite',
            storage: path.join(__dirname, '../db/local.sqlite'),
          },
        },
      }),
    ],
  });
};
