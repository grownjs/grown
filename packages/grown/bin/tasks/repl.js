'use strict';

const path = require('path');

const USAGE_INFO = `

Start the application console

--use   Entry file exporting referenced models

Hooks:
  connect   # Load and attach your models into the REPL

Examples:
  grown repl connect --use db/models

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    Grown.use(require('@grown/repl'));

    Grown.REPL.start({
      connect(ctx) {
        /* istanbul ignore else */
        if (!Grown.argv.flags.use || typeof Grown.argv.flags.use !== 'string') {
          throw new Error(`Missing models to --use, given '${Grown.argv.flags.use || ''}'`);
        }

        Grown.use(require('@grown/model'));

        const database = path.resolve(Grown.cwd, Grown.argv.flags.use);
        const factory = require(database);
        const Models = factory(Grown, util);

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
