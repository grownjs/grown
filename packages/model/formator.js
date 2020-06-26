'use strict';

module.exports = Grown => {
  const Formator = require('formator');

  return Grown('Model.Formator', {
    from(Model, params, options) {
      return new Formator(this.database).bind(Model, params, options);
    },
    $install(ctx) {
      const connections = [];

      ctx.mount(this.prefix || '/', (req, res, next) => {
        const database = typeof this.database === 'function'
          ? this.database(req)
          : this.database;

        if (!database) {
          res.write('Database was not given\n');
          res.end();
          return;
        }

        if (!(database.sequelize && database.sequelize._resolved)) {
          res.write(`Not connected to '${found.database.sequelize.options.identifier}' database\n`);
          res.end();
          return;
        }

        let found = connections.find(x => x.database === database);

        if (!found) {
          const middleware = new Formator(database).hook(this.options);

          connections.push({ database, middleware });

          found = { middleware };
        }

        return found.middleware(req, res, next);
      });
    },
  });
};
