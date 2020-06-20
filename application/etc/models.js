const path = require('path');

module.exports = Shopfish => {
  Shopfish.use(require('@grown/model/db'));
  Shopfish.use(require('@grown/model/cli'));

  return Shopfish('Models', {
    include: [
      Shopfish.Model.DB.bundle({
        models: path.join(__dirname, '../api/schema/models'),
        database: {
          config: require('../db/config'),
          refs: require('../api/schema/generated'),
        },
      }),
    ],
  });
};
