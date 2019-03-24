'use strict';

module.exports = (Grown, util) => ({
  connect: {
    description: 'Load your database, e.g. `.connect path/to/models`',
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
