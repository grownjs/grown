require('logro').setForbiddenFields(require('./api/forbidden.json'));

const path = require('path');
const log = require('logro').createLogger(__filename);
const { Plugin } = require('./etc/shared')
const Shopfish = require('./etc');

const start = new Date();

const initServer = module.exports = () => {
  Shopfish.use(require('@grown/model'));
  Shopfish.use(require('@grown/router'));
  Shopfish.use(require('@grown/render'));
  Shopfish.use(require('@grown/static'));
  Shopfish.use(require('@grown/graphql'));
  Shopfish.use(require('@grown/session/auth'));

  const config = require('./api/config');

  const server = new Shopfish({
    cors: Shopfish.env !== 'production',
  });

  if (process.env.U_WEBSOCKETS_SKIP) {
    server.plug(require('body-parser').json({ limit: '5mb' }));
    server.plug(require('body-parser').urlencoded({ extended: false }));
  }

  const hooks = Plugin.from(path.join(__dirname, 'etc/plugins'), cb => cb(Shopfish, config))
    .map(plugin => (Shopfish[plugin.name] = plugin));

  function hook(name, ...args) {
    hooks.forEach(hook => {
      if (hook.enabled && typeof hook[name] === 'function') {
        hook[name](...args);
      }
    });
  }

  const static_dirs = hooks.reduce((memo, hook) => {
    const publicDir = path.join(__dirname, `etc/plugins/${hook.id}/public`);

    if (hook.enabled && Plugin.isDir(publicDir)) {
      memo.push(publicDir);
    }
    return memo;
  }, []);

  async function main(ctx) {
    hook('onStart', ctx);
  }

  hook('onInit', server);

  server.mount(ctx => {
    const site = Shopfish.adminPlugin.siteManager.locate(ctx);

    if (site && site.config.root && ctx.req.url === '/') {
      ctx.req.originalUrl = ctx.req.url;
      ctx.req.url = site.config.root;
    }

    const fileName = ctx.req.url.split('?')[0];
    const exists = static_dirs.some(cwd => Plugin.isFile(path.join(cwd, fileName)));

    if (!exists && site && Array.isArray(site.config.rewrite)) {
      site.config.rewrite.some(pattern => {
        const [prefix, suffix] = pattern.split(':');
        const trailingSlash = prefix.substr(-1) === '/' ? '/' : '';

        if (ctx.req.url.indexOf(prefix) === 0) {
          ctx.req.originalUrl = ctx.req.url;
          ctx.req.url = ctx.req.url.replace(prefix, `/${site.id}${suffix}${trailingSlash}`);
          return true;
        }
        return false;
      });
    }

    ctx.req.site = site;
    hook('onRequest', ctx);
  });

  server.mount('/api/v1/graphql', Shopfish.GraphQL.setup([
    path.join(__dirname, 'api/schema/common.gql'),
    path.join(__dirname, 'api/schema/generated/index.gql'),
  ], Shopfish.load(path.join(__dirname, 'api/schema/graphql'))));

  server.plug([
    require('express-useragent').express(),
    require('logro').getExpressLogger(),
    Shopfish.Model.Formator({
      prefix: '/db',
      options: { attributes: false },
      database: req => Shopfish.Model.DB[req.site ? req.site.config.database : 'default'],
    }),
    Shopfish.Session.Auth.use('/auth', {
      facebook: {
        enabled: req => (req.site ? !!req.site.config.facebook : true),
        credentials: req => (req.site ? req.site.config.facebook : config.facebook),
      },
    }, (type, userInfo) => Shopfish.Services.API.Session.checkLogin({ params: { type, auth: userInfo } })),
    Shopfish.Static({
      from_folders: static_dirs.concat(path.join(__dirname, 'tenants')),
    }),
    Shopfish.Render.Views({
      view_folders: [
        path.join(__dirname, 'etc/plugins'),
        path.join(__dirname, 'etc/tenants'),
      ],
    }),
    Shopfish.Router.Mappings({
      routes: map => hook('routeMappings', map),
    }),
  ]);

  server.on('start', () => Shopfish.Models.connect().then(() => Shopfish.Services.start()).then(main));
  server.on('listen', ctx => log.info(`API started after ${(new Date() - start) / 1000} seconds`, { endpoint: ctx.location.href }));

  return server;
};

if (require.main === module) {
  initServer()
    .listen(Shopfish.argv.flags.port || 3000)
    .catch(e => {
      log.exception(e, 'E_FATAL');
      process.exit(1);
    });
}
