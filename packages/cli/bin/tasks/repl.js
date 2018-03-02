'use strict';

const USAGE_INFO = `

Start the console

--db    Database to be used, identifier
--use   Entry file exporting models

Hooks:
  db   # Load models into the session
  use  # Load external modules

Examples:
  grown repl db --use db/models
  grown repl use:lib/services use:path/to/module

NOTE: All additional arguments are executed as single hooks

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    Grown.use(require('@grown/repl'));
    Grown.REPL.start(require('../lib/hooks')(Grown, util));
  },
};
