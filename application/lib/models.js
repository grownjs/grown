const path = require('path');

module.exports = App => {
  App.use(require('@grown/model/db'));
  App.use(require('@grown/model/cli'));

  return App('Models', {
    include: [
      App.Model.DB.bundle({
        models: path.join(__dirname, '../api/schema/models'),
        database: {
          config: require('../db/config'),
          refs: require('../api/schema/generated/index.json'),
        },
      }),
    ],
  });
};
