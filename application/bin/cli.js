const Grown = require('@grown/bud')();

Grown.use(require('@grown/repl'));
Grown.use(require('@grown/cli'));

Grown.REPL.add('example', 'Just an example command', (ctx, util) => {
  ctx.logger.printf('\r\r%s\n', util.inspect({
    _: ctx._,
    raw: ctx.raw,
    data: ctx.data,
    flags: ctx.flags,
    params: ctx.params,
  }));
});

Grown('CLI', {
  task_folders: [
    `${__dirname}/../tasks`,
  ],
});

Grown.CLI.start(Grown.argv._.shift())
  .catch(e => {
    Grown.Logger.error(e.message || e.toString());
    process.exit(1);
  });
