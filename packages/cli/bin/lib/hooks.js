'use strict';

module.exports = (Grown, util) => ({
  import: {
    description: 'Import symbols into the context, e.g. `.import lib/helpers`',
    callback(ctx) {
      require('./imports')(Grown, util, ctx);
    },
  },
  models: {
    description: 'Load your database, e.g. `.models path/to/models`',
    callback(ctx) {
      const Models = require('./models')(Grown, util, ctx);

      return Models.connect()
        .then(() => {
          const models = Models.models || [];
          const count = models.length;

          models.forEach(m => {
            ctx.repl.context[m.name] = m;
          });

          const suffix = count === 1 ? '' : 's';
          const modelNames = models.map(m => m.name).join(', ');

          ctx.logger.printf('{% info %s model%s found: %} %s\r\n', count, suffix, modelNames);
        });
    },
  },
});
