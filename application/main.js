const log = require('logro').createLogger(__filename);

const Application = require('./lib');

const start = new Date();

const initServer = module.exports = () => {
  Application.use(require('@grown/graphql'));
  Application.use(require('@grown/parsers'));
  Application.use(require('@grown/session/auth'));
  Application.use(require('@grown/model/resource'));

  const server = new Application();

  server.plug([
    Application.Parsers.JSON,
    Application.Parsers.URLENCODED,
  ]);

  const path = require('path');

  server.mount('/', Application.GraphQL.setup([
    path.join(__dirname, 'api/schema/common.gql'),
    path.join(__dirname, 'api/schema/generated/index.gql'),
  ], Application.load(path.join(__dirname, 'web/api/graphql'))));

  server.mount('/db', Application.Model.Resource.bind(Application.Model.DB.default));

  server.on('start', () => {
    return Application.Models.connect().then(() => Application.Services.start());
  });

  return server;
};

if (require.main === module) {
  initServer()
    .listen(Application.argv.flags.port || 8080)
    .then(server => {
      log.info(`API started after ${(new Date() - start) / 1000} seconds`, { endpoint: server.location.href });
    })
    .catch(e => {
      log.exception(e, 'E_FATAL');
      process.exit(1);
    });
}
