const Grown = require('@grown/bud')();

Grown.use(require('@grown/cli'));

if (Grown.argv.flags.version) {
  Grown.Logger.getLogger()
    .printf('\r{% green Grown v%s %}\r\n', Grown.version);
} else {
  Grown.CLI.start(Grown.argv._[0]);
}
