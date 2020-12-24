module.exports = Shopfish => {
  Shopfish.use(require('@grown/model/db'));
  Shopfish.use(require('@grown/model/cli'));

  return Shopfish('Models', {
    include: [
      Shopfish.Model.DB.bundle({
        models: `${__dirname}/schema/models`,
        database: {
          refs: require('~/etc/schema/generated').default,
          config: require('../db/config'),
        },
      }),
    ],
  });
};
