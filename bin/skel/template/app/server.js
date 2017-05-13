/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */

const Grown = require('grown');
const path = require('path');

// fresh context
module.exports = cwd => {
  // setup environment
  Grown.env(cwd);

  const $ = new Grown({
    env: process.env.NODE_ENV || 'development',
    appDir: path.resolve(cwd, process.env.APP_DIR || 'app'),
    publicDir: path.resolve(cwd, process.env.PUBLIC_DIR || 'public'),
    session: {
      secret: process.env.SESSION_SECRET || 'secret*value',
      keys: (process.env.SESSION_KEYS || 'secret*value').split(/\s+/),
      maxAge: parseInt(process.env.SESSION_MAXAGE || 0, 10) || 86400000,
    },
    upload: {
      multiple: process.env.UPLOAD_MULTIPLE === 'true' || true,
      maxFiles: parseInt(process.env.UPLOAD_MAXFILES, 0) || 10,
    },
    logger: {
      chalkize: process.env.LOGGER_COLORIZE === 'true' || true,
    },
  });

  // inject logging helpers
  $.use(Grown.plugs.logger({
    transports: [{
      Console: {
        chalkize: $.get('logger.chalkize'),
      },
    }],
  }));

  // standard mvc kit
  $.use(Grown.plugs.models($.get('appDir')));
  $.use(Grown.plugs.render($.get('appDir')));
  $.use(Grown.plugs.router($.get('appDir')));

  $.mount(require('body-parser').json());
  $.mount(require('body-parser').urlencoded({ extended: false }));

  // built-in method-override
  $.mount('_method', conn => {
    const _method = conn.query_params._method || conn.body_params._method
      || conn.req_headers['x-method-override']
      || conn.req_headers['x-http-method']
      || conn.req_headers['x-http-method-override'];

    /* istanbul ignore else */
    if (_method) {
      conn.req.originalMethod = conn.req.method;
      conn.req.method = _method.toUpperCase();

      // remove _method from query
      conn.req.url = conn.req.url
        .replace(/([&?])_method=\w+&?/g, '$1');

      // remove _method from body
      delete conn.req.body._method;
    }
  });

  $.use(Grown.plugs.upload($.get('upload')));
  $.use(Grown.plugs.session($.get('session')));

  return $;
};

// export framework version and teardown
module.exports.version = Grown.version;
module.exports.teardown = cb => Grown.burn(cb);
