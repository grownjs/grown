const log = require('logro').createLogger(__filename);
const path = require('path');

const start = new Date();

module.exports = Shopfish => {
  const { Plugin } = require('./shared');
  const config = require('./config');

  const hooks = Plugin.from(path.join(Shopfish.cwd, 'apps'), cb => cb(Shopfish, config))
    .map(plugin => (Shopfish.ApplicationServer[plugin.name] = plugin, plugin)); // eslint-disable-line

  function hook(name, ...args) {
    hooks.forEach(_hook => {
      if (_hook.enabled && typeof _hook[name] === 'function') {
        _hook[name](...args, Shopfish);
      }
    });
  }

  async function main(ctx) {
    hook('onStart', ctx);
  }

  const server = new Shopfish({
    cors: Shopfish.env !== 'production',
  });

  hook('onInit', server);

  Shopfish.use(require('@grown/model'));
  Shopfish.use(require('@grown/router'));
  Shopfish.use(require('@grown/render'));
  Shopfish.use(require('@grown/tarima'));
  Shopfish.use(require('@grown/static'));
  Shopfish.use(require('@grown/graphql'));
  Shopfish.use(require('@grown/session/auth'));

  if (process.env.U_WEBSOCKETS_SKIP) {
    server.plug(require('body-parser').json({ limit: '5mb' }));
    server.plug(require('body-parser').urlencoded({ extended: false }));
  }

  server.plug([
    require('express-useragent').express(),
    require('logro').getExpressLogger(),
    Shopfish.Static({
      from_folders: path.join(Shopfish.cwd, 'build'),
    }),
  ]);

  server.mount(ctx => {
    const site = Shopfish.ApplicationServer.adminPlugin.siteManager.locate(ctx);

    ctx.req.site = site;
    hook('onRequest', ctx);
  });

  server.plug([
    Shopfish.Model.Formator({
      prefix: '/db',
      options: {
        attributes: false,
        connections: req => (!req.site && Object.keys(Shopfish.Model.DB._registry)),
      },
      database: req => {
        const matches = req.url.match(/^\/([a-z]\w+)(|\/.*?)$/);
        const target = req.site && req.site.id;

        if (matches && Shopfish.Model.DB._registry[matches[1]]) {
          req.originalUrl = req.url;
          req.url = matches[2] || '/';

          return Shopfish.Model.DB[matches[1]];
        }

        if (target && Shopfish.Model.DB._registry[target]) {
          return Shopfish.Model.DB[target];
        }

        return Shopfish.Model.DB.default;
      },
    }),
    Shopfish.Session.Auth.use('/auth', {
      facebook: {
        enabled: req => (req.site ? req.site.config.facebook !== false : true),
        credentials: req => (req.site ? req.site.config.facebook : config.facebook),
      },
    }, (type, userInfo) => Shopfish.Services.API.Session.checkLogin({
      params: {
        type,
        auth: {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture ? userInfo.picture.data.url : '',
        },
      },
    })),
  ]);

  server.mount('/api/v1/graphql', Shopfish.GraphQL.setup([
    path.join(Shopfish.cwd, 'etc/schema/common.gql'),
    path.join(Shopfish.cwd, 'etc/schema/generated/index.gql'),
  ], Shopfish.load(Shopfish.ApplicationServer.getSites().find('graphql'))));

  server.mount(ctx => {
    const { url, site } = ctx.req;
    const fileName = url.split('?')[0];

    if (site && site.config.root && fileName === '/') {
      ctx.req.originalUrl = url;
      ctx.req.url = site.config.root;
    }

    if (site && Array.isArray(site.config.rewrite)) {
      site.config.rewrite.some(pattern => {
        const [prefix, suffix] = pattern.split(':');
        const trailingSlash = prefix.substr(-1) === '/' ? '/' : '';

        if (url.indexOf(prefix) === 0) {
          ctx.req.originalUrl = url;
          ctx.req.url = url.replace(prefix, `/${site.id}${suffix}${trailingSlash}`);
          return true;
        }
        return false;
      });
    }
  });

  server.plug([
    Shopfish.Tarima.Bundler({
      bundle_options: Shopfish.pkg.tarima.bundleOptions,
      working_directory: path.join(Shopfish.cwd, 'apps'),
      compile_extensions: ['pug'],
    }),
    Shopfish.Render.Views({
      view_folders: path.join(Shopfish.cwd, 'apps'),
    }),
    Shopfish.Router.Mappings({
      routes: map => hook('routeMappings', map),
    }),
    Shopfish.Static({
      from_folders: path.join(Shopfish.cwd, 'apps'),
    }),
  ]);

  server.on('start', () => Shopfish.ApplicationServer.start().then(() => Shopfish.Services.start()).then(main));
  server.on('listen', ctx => log.info(`API started after ${(new Date() - start) / 1000} seconds`, { endpoint: ctx.location.href }));

  return server;
};
