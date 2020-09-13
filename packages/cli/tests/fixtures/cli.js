const Grown = require('../../../bud')();

Grown.use(require('../..'));

Grown.CLI.start(Grown.argv._[0]).catch(e => {
  Grown.Logger.getLogger()
    .printf('\r{% error %s %}\r\n', e.message);

  process.exit(1);
});
