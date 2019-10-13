if (process.env.NODE_ENV !== 'production') {
  global.console.debug = (...args) => {
    args.forEach(input => {
      process.stdout.write(JSON.stringify({ level: 'INFO', ...input }));
    });
  };
}

const log = require('logro').createLogger(__filename);
const Application = require('./lib');

const start = new Date();

const initServer = module.exports = () => {
  Application.use(require('@grown/graphql'));
  Application.use(require('@grown/parsers'));
  Application.use(require('@grown/session/auth'));
  Application.use(require('@grown/model/formator'));

  const server = new Application({
    cors: Application.env !== 'production',
  });

  server.plug([
    Application.Parsers.URLENCODED,
    Application.Parsers.JSON,
    require('express-useragent').express(),
    require('logro').getExpressLogger(),
    Application.Model.Formator({
      prefix: '/db',
      options: { attributes: false },
      database: Application.Model.DB.default,
    }),
  ]);

  const path = require('path');

  server.mount('/', Application.GraphQL.setup([
    path.join(__dirname, 'lib/api/schema/common.gql'),
    path.join(__dirname, 'lib/api/schema/generated/index.gql'),
  ], Application.load(path.join(__dirname, 'web/api/graphql'))));

  server.on('start', () => Application.Models.connect().then(() => Application.Services.start()));
  server.on('listen', ctx => log.info(`API started after ${(new Date() - start) / 1000} seconds`, { endpoint: ctx.location.href }));

  return server;
};

if (require.main === module) {
  initServer()
    .listen(Application.argv.flags.port || 3000)
    .catch(e => {
      log.exception(e, 'E_FATAL');
      process.exit(1);
    });
}
