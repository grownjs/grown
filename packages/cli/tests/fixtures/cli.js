const Grown = require('@grown/bud')();

Grown.use(require('@grown/cli'));

Grown.CLI.start(Grown.argv._[0]).catch(e => {
  Grown.Logger.getLogger()
    .printf('\r{% error %s %}\r\n', e.message);

  process.exit(1);
});
