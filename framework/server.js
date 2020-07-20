const start = new Date();
const path = require('path');

module.exports = (Grown, opts) => {
  const { Plugin } = require('./shared');

  const app = path.basename(Grown.cwd);
  const log = require('logro').createLogger(app);

  const defaults = require(path.join(Grown.cwd, 'config'));
  const hooks = [];

  function add(dir) {
    Plugin.from(dir, cb => cb(Grown, defaults))
      .forEach(plugin => {
        Grown.ApplicationServer[plugin.name] = plugin;
        hooks.push(plugin);
      });
  }

  opts.shared_folders.forEach(add);

  function hook(name, ...args) {
    hooks.forEach(_hook => {
      if (_hook.enabled && typeof _hook[name] === 'function') {
        _hook[name](...args, Grown);
      }
    });
  }

  async function main(ctx) {
    hook('onStart', ctx);
  }

  const server = new Grown({
    cors: Grown.env !== 'production',
  });

  hook('onInit', server);

  Grown.use(require('@grown/model'));
  Grown.use(require('@grown/router'));
  Grown.use(require('@grown/render'));
  Grown.use(require('@grown/tarima'));
  Grown.use(require('@grown/static'));
  Grown.use(require('@grown/upload'));
  Grown.use(require('@grown/session/auth'));

  if (process.env.U_WEBSOCKETS_SKIP) {
    server.plug(require('body-parser').json({ limit: '5mb' }));
    server.plug(require('body-parser').urlencoded({ extended: false }));
  }

  server.plug([
    require('express-useragent').express(),
    require('logro').getExpressLogger(),
    Grown.Static({
      from_folders: path.join(Grown.cwd, 'build'),
    }),
    Grown.Upload({
      save_directory: path.join(Grown.cwd, 'tmp/uploads'),
    }),
  ]);

  server.mount(ctx => {
    const site = Grown.ApplicationServer.adminPlugin.siteManager.locate(ctx);

    ctx.req.site = site;
    hook('onRequest', ctx);
  });

  server.plug([
    opts.formator !== false && Grown.Model.Formator({
      prefix: '/db',
      options: {
        attributes: false,
        uploadDir: 'tmp/uploads',
        onUpload: ({ field, payload, metadata }) => {
          payload[field] = `/${metadata.filePath.replace('tmp/uploads', '')}`;
        },
        connections: req => (!req.site && Object.keys(Grown.Model.DB._registry)),
      },
      database: req => {
        const matches = req.url.match(/^\/([a-z]\w+)(|\/.*?)$/);
        const target = req.site && req.site.id;

        if (matches && Grown.Model.DB._registry[matches[1]]) {
          req.originalUrl = req.url;
          req.url = matches[2] || '/';

          return Grown.Model.DB[matches[1]];
        }

        if (target && Grown.Model.DB._registry[target]) {
          return Grown.Model.DB[target];
        }

        return Grown.Model.DB.default;
      },
    }),
    Grown.Session.Auth.use('/auth', {
      facebook: {
        enabled: req => (req.site ? req.site.config.facebook !== false : true),
        credentials: req => (req.site ? req.site.config.facebook : defaults.facebook),
      },
    }, (type, userInfo) => Grown.Services.API.Session.checkLogin({
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

  if (opts.graphql !== false) {
    Grown.use(require('@grown/graphql'));
    server.mount('/api/v1/graphql', Grown.GraphQL.setup([
      path.join(Grown.cwd, 'etc/schema/common.gql'),
      path.join(Grown.cwd, 'etc/schema/generated/index.gql'),
    ], Grown.load(Grown.ApplicationServer.getSites().find('graphql'))));
  }

  if (opts.rewrite !== false) {
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
  }

  server.plug([
    Grown.Tarima.Bundler({
      include_path: opts.shared_folders,
      bundle_options: Grown.pkg.tarima.bundleOptions,
      compile_extensions: ['pug', 'hbs', 'ejs'],
    }),
    Grown.Render.Views({
      view_folders: opts.shared_folders,
    }),
    Grown.Router.Mappings({
      routes: map => hook('routeMappings', map),
    }),
    Grown.Static({
      from_folders: opts.shared_folders,
    }),
  ]);

  server.on('start', () => Grown.ApplicationServer.start().then(() => Grown.Services.start()).then(main));
  server.on('listen', ctx => log.info(`API started after ${(new Date() - start) / 1000} seconds`, { endpoint: ctx.location.href }));

  return server;
};
