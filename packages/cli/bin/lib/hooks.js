'use strict';

module.exports = (Grown, util) => ({
  import: {
    description: 'Import symbols into the context, e.g. `.import lib/helpers`',
    callback(ctx) {
      return require('./imports')(Grown, util, ctx);
    },
  },
  models: {
    description: 'Load your database, e.g. `.models path/to/models`',
    async callback(ctx) {
      const Models = await require('./models')(Grown, util, ctx);

      return Models.connect()
        .then(() => {
          const models = Object.keys(Models.models);
          const count = models.length;

          models.forEach(m => {
            ctx.repl.context[m] = Models.get(m);
          });

          const suffix = count === 1 ? '' : 's';
          const modelNames = models.join(', ');

          ctx.logger.printf('\r{% info. %s model%s found: %} %s\n', count, suffix, modelNames);
        });
    },
  },
});
