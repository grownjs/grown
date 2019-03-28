const { Application } = require('./lib');

Application.use(require('@grown/server'));
Application.use(require('@grown/graphql'));
Application.use(require('@grown/parsers'));
Application.use(require('@grown/session/auth'));

const initServer = module.exports = () => {
  const server = new Application();

  server.plug([
    Application.Parsers.JSON,
    Application.Parsers.URLENCODED,
  ]);

  const path = require('path');

  server.mount('/', Application.GraphQL.setup([
    path.join(__dirname, 'api/schema/common.gql'),
    path.join(__dirname, 'api/schema/generated/index.gql'),
  ], Application.load(path.join(__dirname, 'web/api/graphql'))),);

  server.on('start', () => {
    return Application.Models.connect()
      .then(() => Application.Services.start());
  });

  return server;
};

if (require.main === module) {
  initServer()
    .listen(Application.argv.flags.port || 8080)
    .then(server => {
      console.log('Ready at', server.location.href);
    })
    .catch(e => {
      console.log('[E_FATAL]', e);
      process.exit(1);
    });
}
