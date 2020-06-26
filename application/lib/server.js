const log = require('logro').createLogger(__filename);
const path = require('path');

const start = new Date();

module.exports = Shopfish => {
  Shopfish.use(require('@grown/model'));
  Shopfish.use(require('@grown/router'));
  Shopfish.use(require('@grown/render'));
  Shopfish.use(require('@grown/tarima'));
  Shopfish.use(require('@grown/static'));
  Shopfish.use(require('@grown/graphql'));
  Shopfish.use(require('@grown/session/auth'));

  const config = require('./config');

  const server = new Shopfish({
    cors: Shopfish.env !== 'production',
  });

  if (process.env.U_WEBSOCKETS_SKIP) {
    server.plug(require('body-parser').json({ limit: '5mb' }));
    server.plug(require('body-parser').urlencoded({ extended: false }));
  }

  const { Plugin } = require('./shared');
  const hooks = Plugin.from(path.join(Shopfish.cwd, 'apps'), cb => cb(Shopfish, config))
    .map(plugin => (Shopfish.ApplicationServer[plugin.name] = plugin, plugin)); // eslint-disable-line

  function hook(name, ...args) {
    hooks.forEach(_hook => {
      if (_hook.enabled && typeof _hook[name] === 'function') {
        _hook[name](...args);
      }
    });
  }

  async function main(ctx) {
    hook('onStart', ctx);
  }

  hook('onInit', server);

  server.mount(ctx => {
    const site = Shopfish.ApplicationServer.adminPlugin.siteManager.locate(ctx);
    const fileName = ctx.req.url.split('?')[0];

    if (site && site.config.root && fileName === '/') {
      ctx.req.originalUrl = ctx.req.url;
      ctx.req.url = site.config.root;
    }

    if (site && Array.isArray(site.config.rewrite)) {
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
    path.join(Shopfish.cwd, 'etc/schema/common.gql'),
    path.join(Shopfish.cwd, 'etc/schema/generated/index.gql'),
  ], Shopfish.load(Shopfish.ApplicationServer.getSites().find('graphql'))));

  server.plug([
    require('express-useragent').express(),
    require('logro').getExpressLogger(),
    Shopfish.Static({
      from_folders: path.join(Shopfish.cwd, 'apps'),
    }),
    Shopfish.Model.Formator({
      prefix: '/db',
      options: {
        attributes: false,
        connections: Object.keys(require('~/etc/schema/generated')),
      },
      database: req => {
        const matches = req.url.match(/^\/([a-z]\w+)(|\/.*?)$/);

        if (matches && Shopfish.Model.DB[matches[1]]) {
          req.originalUrl = req.url;
          req.url = matches[2] || '/';

          return Shopfish.Model.DB[matches[1]];
        }

        return Shopfish.Model.DB.default;
      },
    }),
    Shopfish.Session.Auth.use('/auth', {
      facebook: {
        enabled: req => (req.site ? !!req.site.config.facebook : true),
        credentials: req => (req.site ? req.site.config.facebook : config.facebook),
      },
    }, (type, userInfo) => Shopfish.Services.API.Session.checkLogin({ params: { type, auth: userInfo } })),
    Shopfish.Tarima.Bundler({
      bundle_options: {
        ...Shopfish.pkg.tarima.bundleOptions,
        working_directory: path.join(Shopfish.cwd, 'apps'),
      },
    }),
    Shopfish.Render.Views({
      view_folders: path.join(Shopfish.cwd, 'apps'),
    }),
    Shopfish.Router.Mappings({
      routes: map => hook('routeMappings', map),
    }),
  ]);

  server.on('start', () => Shopfish.ApplicationServer.start().then(() => Shopfish.Services.start()).then(main));
  server.on('listen', ctx => log.info(`API started after ${(new Date() - start) / 1000} seconds`, { endpoint: ctx.location.href }));

  return server;
};
