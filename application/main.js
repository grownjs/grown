require('logro').setForbiddenFields(require('./api/forbidden.json'));

const log = require('logro').createLogger(__filename);
const App = require('./lib');

const start = new Date();

const initServer = module.exports = () => {
  App.use(require('@grown/model'));
  App.use(require('@grown/router'));
  App.use(require('@grown/graphql'));
  App.use(require('@grown/session/auth'));

  const config = require('./api/config');

  const server = new App({
    cors: App.env !== 'production',
  });

  server.plug([
    require('express-useragent').express(),
    require('logro').getExpressLogger(),
    App.Model.Formator({
      prefix: '/db',
      options: { attributes: false },
      database: App.Model.DB.default,
    }),
    App.Router.Mappings({
      routes(map) {
        // how this shit works?
        return map()
          .get('/validate-access/:token', ctx => {
            console.log('>>>', ctx.req.params, ctx.req.handler, ctx.req.handler.url('42'));
          });
      },
    }),
    App.Session.Auth.use('/auth', {
      facebook: {
        enabled: true,
        credentials: config.facebook,
      },
    }, (type, userInfo) => App.Services.API.Session.checkLogin({ params: { type, auth: userInfo } })),
  ]);

  const path = require('path');

  server.mount('/api/v1/graphql', App.GraphQL.setup([
    path.join(__dirname, 'api/schema/common.gql'),
    path.join(__dirname, 'api/schema/generated/index.gql'),
  ], App.load(path.join(__dirname, 'api/schema/graphql'))));

  server.on('start', () => App.Models.connect().then(() => App.Services.start()));
  server.on('listen', ctx => log.info(`API started after ${(new Date() - start) / 1000} seconds`, { endpoint: ctx.location.href }));

  return server;
};

if (require.main === module) {
  initServer()
    .listen(App.argv.flags.port || 3000)
    .catch(e => {
      log.exception(e, 'E_FATAL');
      process.exit(1);
    });
}
