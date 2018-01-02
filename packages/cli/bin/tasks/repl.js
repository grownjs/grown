'use strict';

const USAGE_INFO = `

Start the console

--db    Database to be used, identifier
--use   Entry file exporting models

Hooks:
  models   # Load and attach your models into the REPL

Examples:
  grown repl models --use db/models

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    Grown.use(require('@grown/repl'));
    Grown.REPL.start(require('../lib/helpers')(Grown, util));
  },
};
