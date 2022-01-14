'use strict';

/* istanbul ignore file */

const USAGE_INFO = `

  Interactive console application

  --load  Optional. Run scripts into the REPL

  Hooks:
    import:PATH   # Load symbols into the session
    models:PATH   # Load models into the session

  All hooks can be invoked inside the REPL too,
  just prefix them with '.', e.g. \`.import lib\`

  Examples:
    {bin} console models:db/models
    {bin} console --load path/to/commands import:lib

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    if (!Grown.REPL) {
      Grown.use(require('@grown/repl'));
    }

    if (!Grown.argv.params.models && Grown.argv._[1]) {
      Grown.argv.params.models = Grown.argv._[1];
    }

    Grown.REPL.add(require('../lib/hooks')(Grown, util));
    Grown.REPL.start();
  },
};
