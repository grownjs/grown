'use strict';

const USAGE_INFO = `

  Start the console

  --load  Optional. Run scripts into the REPL

  Hooks:
    import   # Load symbols into the session
    models   # Load models into the session

  All hooks can be invoked inside the REPL,
  just prefix them with '.', e.g. \`.import lib\`

  Examples:
    grown repl models:db/models
    grown repl --load path/to/commands import:lib

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
