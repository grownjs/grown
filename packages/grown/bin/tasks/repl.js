'use strict';

const USAGE_INFO = `

Start the application console

--use   Entry file exporting referenced models

Hooks:
  models   # Load and attach your models into the REPL

Examples:
  grown repl models --use db/models

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    Grown.use(require('@grown/repl'));

    Grown.REPL.start({
      models(ctx) {
        const Models = require('./_models')(Grown, util);

        return Models.connect().then(() => {
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
  },
};
