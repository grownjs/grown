require('logro').setForbiddenFields(require('./api/forbidden.json'));

const log = require('logro').createLogger(__filename);
const Application = require('./lib');

const start = new Date();

const initServer = module.exports = () => {
  Application.use(require('@grown/graphql'));
  Application.use(require('@grown/parsers'));
  Application.use(require('@grown/session/auth'));
  Application.use(require('@grown/model/formator'));

  const config = require('./api/config');

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
    Application.Session.Auth.use('/auth', {
      facebook: {
        enabled: true,
        credentials: config.facebook,
      },
    }, (type, userInfo) => Application.Services.API.Session.checkLogin({ params: { type, auth: userInfo } })),
  ]);

  const path = require('path');

  server.mount('/api/v1/graphql', Application.GraphQL.setup([
    path.join(__dirname, 'api/schema/common.gql'),
    path.join(__dirname, 'api/schema/generated/index.gql'),
  ], Application.load(path.join(__dirname, 'api/schema/graphql'))));

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
