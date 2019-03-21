'use strict';

const USAGE_INFO = `

Start the console

--db    Database to be used, identifier
--use   Entry file exporting models (Repo only)
--load  Run scripts into the REPL

Hooks:
  connect  # Load models into the session

Examples:
  grown repl connect --use db/models
  grown repl --load path/to/commands

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    if (!Grown.REPL) {
      Grown.use(require('@grown/repl'));
    }

    Grown.REPL.add(require('../lib/hooks')(Grown, util));
    Grown.REPL.start();
  },
};
