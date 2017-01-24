/* eslint-disable global-require */

const homegrown = require('../..');
const path = require('path');

const cwd = process.cwd();

// setup environment
homegrown.env(cwd);

// common helpers
const _ = require('./_util');

// fresh context
module.exports = () => {
  const Homegrown = homegrown();

  const farm = Homegrown.new({
    env: process.env.NODE_ENV || 'dev',
    appDir: path.resolve(cwd, process.env.APP_DIR || 'app'),
    publicDir: path.resolve(cwd, process.env.PUBLIC_DIR || 'public'),
    session: {
      secret: process.env.SESSION_SECRET || 'secret*value',
      keys: (process.env.SESSION_KEYS || 'secret*value').split(/\s+/),
      maxAge: parseInt(process.env.SESSION_MAXAGE || 0, 10) || 86400000,
    },
    upload: {
      multiple: _.toBool(process.env.UPLOAD_MULTIPLE) || true,
      maxFiles: parseInt(process.env.UPLOAD_MAXFILES, 0) || 10,
    },
    logger: {
      format: process.env.LOGGER_FORMAT || 'dev',
      chalkize: _.toBool(process.env.LOGGER_COLORIZE) || true,
    },
  });

  // import native support
  farm.extensions('Homegrown.conn.http', () => require('http'));

  // log as soon as possible
  farm.mount(require('morgan')(farm.get('logger.format')));

  // try static handler first
  farm.mount(require('serve-static')(farm.get('publicDir')));

  // inject logging helpers
  farm.use(homegrown.plugs.logger({
    transports: [{
      Console: {
        chalkize: farm.get('logger.chalkize'),
      },
    }],
  }));

  // standard mvc kit
  farm.use(homegrown.plugs.models(farm.get('appDir'), path.join(__dirname, '_preset')));
  farm.use(homegrown.plugs.render(farm.get('appDir'), path.join(__dirname, '_preset')));
  farm.use(homegrown.plugs.router(farm.get('appDir'), path.join(__dirname, '_preset')));

  farm.mount(require('body-parser').json());
  farm.mount(require('body-parser').urlencoded({ extended: false }));

  // built-in method-override
  farm.mount('_method', (conn) => {
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

  farm.use(homegrown.plugs.upload(farm.get('upload')));
  farm.use(homegrown.plugs.session(farm.get('session')));

  return farm;
};
