'use strict';

module.exports = (Grown, util) => ({
  connect(ctx) {
    const Models = require('./models')(Grown, util);

    return Models.connect()
      .then(() => {
        const models = Models._getModels();
        const count = models.length;

        models.forEach(m => {
          ctx.repl.context[m.name] = m;
        });

        const suffix = count === 1 ? '' : 's';
        const modelNames = models.map(m => m.name).join(', ');

        ctx.logger.printf('{% info %s model%s found: %} %s\r\n', count, suffix, modelNames);
      });
  },
});
