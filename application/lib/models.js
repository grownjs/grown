const path = require('path');

module.exports = Application => {
  Application.use(require('@grown/model/db'));

  return Application('Models', {
    include: [
      Application.Model.DB.bundle({
        models: path.join(__dirname, '../api/schema/models'),
        database: {
          config: require('../db/config'),
          refs: require('../api/schema/generated/index.json'),
        },
      }),
    ],
  });
};
